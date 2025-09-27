import { PREFIX_COMMAND } from '$infrastructure/config/consts.config';
import { createInstance } from '$services/pocketbase/pocketbase';
import type { WAMessage } from 'baileys';
import type { SocketClient } from 'baileys-decorators';
import { Context, getMessageCaption, OnText, Socket } from 'baileys-decorators';

export class BorrowHandler {
  @OnText(PREFIX_COMMAND + 'pinjam', { matchType: 'startsWith' })
  async help(@Socket socket: SocketClient, @Context message: WAMessage) {
    const caption = getMessageCaption(message.message!)
      .replace(/^.pinjam\s+/, '')
      .trim();

    const pb = await createInstance();

    if (caption) {
      try {
        socket.react('⏳');

        // Query PocketBase untuk mencari item berdasarkan remote_id
        const items = await pb.collection('borrow_informations').getFullList({
          filter: pb.filter('remote_id = {:remote_id}', { remote_id: caption })
        });

        // Google Apps Script URL untuk proses peminjaman
        const URL = `https://script.google.com/macros/s/AKfycbxTcx2Cjb0dxYGerx3frMDSIpYwnb4PWHbKe75Qhp4DmYBomWuklbqUL__gxSNlxpoe/exec?id=${encodeURIComponent(caption)}`;

        socket.replyWithQuote({ text: JSON.stringify(items) });
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
