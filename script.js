/* ===== 1. DATA & PENYIMPANAN =====
   const = variabel yang tidak boleh diganti nilainya.
   let   = variabel yang boleh berubah. */
const KUNCI = "catatan-tenang";   // nama "laci" di penyimpanan browser (localStorage)

// Daftar kategori dan emoji-nya. Objek { kunci: [daftar] }.
const KATEGORI = {
  keluar: [["Makan", "🍜"], ["Jajan", "🧋"], ["Transport", "🚌"], ["Belajar", "📚"], ["Hiburan", "🎮"], ["Lainnya", "✨"]],
  masuk:  [["Uang saku", "💌"], ["Gaji", "💼"], ["Hadiah", "🎁"], ["Lainnya", "✨"]],
};

// Memuat data lama. try/catch = kalau penyimpanan error, aplikasi tidak ikut rusak.
// JSON.parse mengubah teks tersimpan menjadi array. "|| []" = kalau kosong, pakai array kosong.
function muat() {
  try { return JSON.parse(localStorage.getItem(KUNCI)) || []; }
  catch (e) { return []; }
}
// Menyimpan data. JSON.stringify mengubah array menjadi teks agar bisa disimpan.
function simpan() {
  try { localStorage.setItem(KUNCI, JSON.stringify(data)); } catch (e) {}
}

let data = muat();   // data = array berisi semua catatan

/* ===== 2. ALAT BANTU =====
   $ = jalan pintas untuk mengambil elemen HTML lewat id-nya. */
const $ = (id) => document.getElementById(id);

// Intl.NumberFormat mengubah 15000 menjadi "Rp15.000" sesuai format Indonesia.
const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Membaca pilihan radio yang sedang aktif ("keluar" atau "masuk").
const jenisAktif = () => document.querySelector('input[name="jenis"]:checked').value;

/* ===== 3. MENU KATEGORI =====
   Isi <select> sesuai jenis. Dipanggil saat halaman dibuka dan saat jenis diganti. */
function isiKategori() {
  const pilihan = $("kategori");
  pilihan.innerHTML = "";                         // kosongkan dulu
  KATEGORI[jenisAktif()].forEach(([nama, ikon]) => {   // loop setiap kategori
    const opsi = document.createElement("option");     // buat elemen <option>
    opsi.value = nama;
    opsi.textContent = ikon + " " + nama;              // textContent = aman dari kode berbahaya
    pilihan.appendChild(opsi);                         // pasang ke dalam <select>
  });
}

/* ===== 4. MENAMPILKAN SEMUANYA =====
   render() menggambar ulang layar setiap kali data berubah. */
function render() {
  // reduce = menjumlahkan. Filter dulu berdasarkan jenis, lalu jumlahkan nominalnya.
  const total = (jenis) => data.filter((d) => d.jenis === jenis).reduce((a, d) => a + d.jumlah, 0);
  const masuk = total("masuk");
  const keluar = total("keluar");
  const saldo = masuk - keluar;

  $("saldo").textContent = formatRupiah(saldo);
  $("masuk").textContent = formatRupiah(masuk);
  $("keluar").textContent = formatRupiah(keluar);

  // Persentase pengeluaran terhadap pemasukan, dibatasi maksimal 100%.
  let persen = masuk > 0 ? (keluar / masuk) * 100 : (keluar > 0 ? 100 : 0);
  persen = Math.min(100, persen);
  const meter = $("meter");
  meter.style.width = persen + "%";               // ubah lebar batang lewat CSS inline
  meter.className = "meter-isi" + (saldo < 0 ? " lewat" : persen >= 80 ? " waspada" : "");

  // Kalimat penyemangat yang berubah sesuai kondisi keuangan.
  let sapa;
  if (data.length === 0)      sapa = "Halo! Yuk catat pelan-pelan, tidak perlu buru-buru 🌱";
  else if (saldo < 0)         sapa = "Pengeluaran melebihi pemasukan. Tidak apa-apa, atur ulang pelan-pelan 💛";
  else if (persen >= 80)      sapa = "Pengeluaran hampir menyentuh pemasukan. Tarik napas, kamu pasti bisa atur ☀️";
  else                        sapa = "Keuanganmu aman. Tetap tenang dan lanjutkan 🌿";
  $("sapa").textContent = sapa;

  // Riwayat: kosongkan, lalu buat ulang satu per satu (yang terbaru di atas).
  const daftar = $("daftar");
  daftar.innerHTML = "";
  $("kosong").hidden = data.length > 0;           // sembunyikan teks "belum ada catatan" kalau sudah ada data

  data.slice().reverse().forEach((d) => {         // slice() = salinan, supaya data asli tidak terbalik
    const ikon = (KATEGORI[d.jenis].find((k) => k[0] === d.kategori) || [0, "✨"])[1];

    const li = document.createElement("li");
    li.className = "item";

    const kotak = document.createElement("div");
    kotak.className = "ikon";
    kotak.textContent = ikon;

    const teks = document.createElement("div");
    const nama = document.createElement("div");
    nama.className = "nama";
    nama.textContent = d.ket;
    const info = document.createElement("div");
    info.className = "info";
    info.textContent = d.kategori + " · " + d.tanggal;
    teks.append(nama, info);

    const uang = document.createElement("div");
    uang.className = "jumlah " + d.jenis;
    uang.textContent = (d.jenis === "masuk" ? "+" : "-") + formatRupiah(d.jumlah);

    const hapus = document.createElement("button");
    hapus.className = "hapus";
    hapus.type = "button";
    hapus.textContent = "×";
    hapus.setAttribute("aria-label", "Hapus catatan " + d.ket);
    hapus.addEventListener("click", () => {        // saat tombol × diklik:
      data = data.filter((x) => x.id !== d.id);    // buang catatan dengan id ini
      simpan();
      render();
    });

    li.append(kotak, teks, uang, hapus);           // susun semua bagian ke dalam <li>
    daftar.appendChild(li);                        // pasang <li> ke daftar di layar
  });
}

/* ===== 5. EVENT (reaksi terhadap aksi pengguna) ===== */

// Saat form dikirim (tombol Simpan ditekan)
$("form").addEventListener("submit", (e) => {
  e.preventDefault();                              // cegah halaman reload bawaan form
  const jumlah = Math.round(Number($("jumlah").value));
  const ket = $("ket").value.trim();               // trim() = buang spasi berlebih di ujung
  if (!ket || !(jumlah > 0)) return;               // kalau tidak valid, berhenti

  data.push({
    id: Date.now(),                                // id unik dari waktu sekarang
    jenis: jenisAktif(),
    ket: ket,
    jumlah: jumlah,
    kategori: $("kategori").value,
    tanggal: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
  });
  simpan();
  render();
  $("ket").value = "";                             // kosongkan isian
  $("jumlah").value = "";
  $("ket").focus();                                // kursor kembali ke kolom pertama
});

// Saat jenis diganti (Pengeluaran <-> Pemasukan), daftar kategori ikut berubah.
document.querySelectorAll('input[name="jenis"]').forEach((r) => r.addEventListener("change", isiKategori));

/* ===== 6. MULAI =====
   Dua baris ini dijalankan sekali saat halaman dibuka. */
isiKategori();
render();
