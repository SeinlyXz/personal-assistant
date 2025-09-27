import { PREFIX_COMMAND } from '$infrastructure/config/consts.config';
import type { WAMessage } from 'baileys';
import type { SocketClient } from 'baileys-decorators';
import { Context, getMessageCaption, OnText, Socket } from 'baileys-decorators';

export class InventoryInfoHandler {
  @OnText(PREFIX_COMMAND + 'info', { matchType: 'startsWith' })
  async help(@Socket socket: SocketClient, @Context message: WAMessage) {
    const caption = getMessageCaption(message.message!)
      .replace(/^.info\s+/, '')
      .trim();

    if (!caption) {
      socket.replyWithQuote({ text: `Format salah. Gunakan: ${PREFIX_COMMAND}info <ID Barang>` });
      return;
    }

    type BorrowItem = {
      collectionId: string;
      collectionName: string;
      id: string;
      remote_id: number;
      total_amount: number;
    };

    type BorrowResponse = {
      items: BorrowItem[];
      page: number;
      perPage: number;
      totalItems: number;
      totalPages: number;
    };
    const BACKEND_URL = Bun.env.REMOTE_API_URL || 'http://localhost:8090';

    const GET_ITEM_URL = `${BACKEND_URL}/api/collections/borrow_informations/records?filter=(remote_id='${encodeURIComponent(caption)}')`;

    if (caption) {
      const URL = `https://script.google.com/macros/s/AKfycbxTcx2Cjb0dxYGerx3frMDSIpYwnb4PWHbKe75Qhp4DmYBomWuklbqUL__gxSNlxpoe/exec?id=${encodeURIComponent(caption)}`;
      try {
        socket.react('⏳');
        const getSumOfItemResponse = await fetch(GET_ITEM_URL)
        const barang = (await getSumOfItemResponse.json() as BorrowResponse).items[0];

        const response = await fetch(URL);
        const data = await response.json();

        if (data.length === 0) {
          socket.replyWithQuote({ text: `Tidak ditemukan barang dengan id: *${caption}*` });
          socket.react('❌');
          return;
        }

        const item = data[0];
        let output = `*Detail Barang: ${item.Entitas}*\n\n`;
        output += `• Jumlah Tersedia: ${item.Jumlah - barang.total_amount}\n`;
        output += `• Jumlah Sedang Dipinjam: ${barang.total_amount}\n`;
        output += `• Rusak/Hilang: ${item['Rusak/Hilang'] || '-'}\n`;
        output += `• Keterangan: ${item.Keterangan || '-'}\n\n`;

        socket.replyWithQuote({ text: output });
        socket.react('✅');
      } catch (error) {
        console.error('Error fetching item data:', error);
        socket.replyWithQuote({
          text: 'Maaf, terjadi kesalahan saat mengambil data barang. Silakan coba lagi nanti.'
        });
        socket.react('❌');
      }
    }
  }
}
