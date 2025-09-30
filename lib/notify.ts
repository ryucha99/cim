// lib/notify.ts
import { prisma } from './prisma';

type NotifyArgs = {
  studentId?: string;
  studentName: string;
  toPhone: string;
  type: 'IN' | 'OUT';
  whenText: string;
};

export async function sendNotify(args: NotifyArgs) {
  const academy = process.env.ACADEMY_NAME || 'OOO 학원';
  const channel = process.env.NOTIFY_PROVIDER || 'mock';

  const message =
    args.type === 'IN'
      ? `${args.studentName}학생, (${args.whenText})에 ${academy}에 출석하였습니다.`
      : `${args.studentName}학생, (${args.whenText})에 ${academy}에 하원하였습니다.`;

  let success: boolean;
  let providerId: string | undefined;
  let error: string | undefined;

  if (channel === 'mock') {
    console.log('[MOCK NOTIFY]', { to: args.toPhone, message });
    success = true;
  } else {
    try {
      // TODO: 실제 알림톡/SMS 연동 호출
      // const res = await fetch(...);
      // success = res.ok; providerId = ...
      success = true;
    } catch (e) {
      success = false;
      error = String(e);
    }
  }

  await prisma.notifyLog.create({
    data: {
      studentId: args.studentId ?? undefined,
      type: args.type,
      channel,
      toPhone: args.toPhone,
      message,
      success,
      providerId,
      error,
    },
  });

  return { ok: success, message };
}
