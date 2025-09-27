import { PREFIX_COMMAND } from '$infrastructure/config/consts.config';
import type { WAMessage } from 'baileys';
import type { SocketClient } from 'baileys-decorators';
import { Context, getMessageCaption, OnText, Socket } from 'baileys-decorators';

export class InventoryHandler {
  @OnText(PREFIX_COMMAND + 'list', { matchType: 'startsWith' })
  async inventory(@Socket socket: SocketClient, @Context message: WAMessage) {
    const caption = getMessageCaption(message.message!)
      .replace(/^.list\s*/, '')
      .trim();

    // Jika ada caption, pakai search. Kalau tidak, ambil semua.
    const URL = caption
      ? `https://script.google.com/macros/s/AKfycbxTcx2Cjb0dxYGerx3frMDSIpYwnb4PWHbKe75Qhp4DmYBomWuklbqUL__gxSNlxpoe/exec?search=${encodeURIComponent(caption)}`
      : `https://script.google.com/macros/s/AKfycbxTcx2Cjb0dxYGerx3frMDSIpYwnb4PWHbKe75Qhp4DmYBomWuklbqUL__gxSNlxpoe/exec`;

    try {
      socket.react('⏳');
      const response = await fetch(URL);
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        const notFoundMsg = caption
          ? `Tidak ditemukan barang dengan kata kunci: *${caption}*`
          : 'Tidak ada data inventori yang tersedia.';
        await socket.replyWithQuote({ text: notFoundMsg });
        await socket.react('❌');
        return;
      }

      let output = caption
        ? `*Hasil Pencarian: ${caption}*\n\n`
        : `*Daftar Inventori Barang:*\n\n`;

      data.forEach((item: any, index: number) => {
        output += `*${index + 1}. ${item.Entitas}*\n`;
        output += `   • Jumlah: ${item.Jumlah}\n`;
        output += `   • Rusak/Hilang: ${item['Rusak/Hilang'] || '-'}\n`;
        output += `   • Keterangan: ${item.Keterangan || '-'}\n\n`;
      });

      output += '_Ketik .pinjam [nama barang] untuk meminjam_';

      await socket.replyWithQuote({ text: output });
      await socket.react('✅');
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      await socket.replyWithQuote({
        text: 'Maaf, terjadi kesalahan saat mengambil data inventori. Silakan coba lagi nanti.',
      });
      await socket.react('❌');
    }
  }
}
