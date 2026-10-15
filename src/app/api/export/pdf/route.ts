import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { generatePDFReport } from "@/lib/export/pdf-generator";

export async function POST(req: NextRequest) {
  try {
    const { userId, startDate, endDate, categoryId, walletId, type } = await req.json();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "User ID wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Check user and plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Starter plan check for advanced export
    if (profile.plan === "starter") {
      return NextResponse.json(
        { ok: false, error: "Fitur export laporan PDF lengkap hanya tersedia untuk pengguna Pro. Silakan upgrade akun Anda." },
        { status: 403 }
      );
    }

    // 2. Fetch transactions with filters
    let query = supabase
      .from("transactions")
      .select("*, category:category_id(*), wallet:wallet_id(*)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false });

    if (startDate) query = query.gte("transaction_date", startDate);
    if (endDate) query = query.lte("transaction_date", endDate);
    if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);
    if (walletId && walletId !== "all") query = query.eq("wallet_id", walletId);
    if (type && type !== "all") query = query.eq("type", type);

    const { data: txs, error: txError } = await query;
    if (txError) {
      return NextResponse.json({ ok: false, error: txError.message }, { status: 500 });
    }

    const transactions = txs || [];

    // Calculate metrics
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "income") {
        totalIncome += amt;
      } else if (t.type === "expense") {
        totalExpense += amt;
        const catName = t.category?.name || "Lainnya";
        categoryTotals[catName] = (categoryTotals[catName] || 0) + amt;
      }
    });

    const netCashflow = totalIncome - totalExpense;

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }));

    const periodLabel = startDate && endDate ? `${startDate} s/d ${endDate}` : "Semua Periode";

    // 3. Generate PDF
    const pdfBuffer = generatePDFReport({
      userName: profile.full_name,
      userEmail: profile.phone_number || "",
      periodLabel,
      totalIncome,
      totalExpense,
      netCashflow,
      topCategories,
      transactions,
    });

    const fileName = `TataDana_Laporan_${profile.full_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    // 4. Try upload to Supabase Storage
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "tatadana-exports";
    let downloadUrl = "";

    try {
      const filePath = `${userId}/${Date.now()}_${fileName}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(filePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        // Create 24h signed URL
        const { data: signed } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, 86400);

        if (signed?.signedUrl) {
          downloadUrl = signed.signedUrl;

          // Record in export_history
          const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();
          await supabase.from("export_history").insert({
            user_id: userId,
            file_name: fileName,
            file_url: downloadUrl,
            format: "pdf",
            period_start: startDate || null,
            period_end: endDate || null,
            expires_at: expiresAt,
          });
        }
      }
    } catch (e) {
      console.warn("Supabase storage upload skipped/errored:", e);
    }

    // Direct binary stream fallback if client wants direct download
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Download-Url": downloadUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
