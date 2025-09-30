import { prisma } from './prisma';

export async function sendNotify(opts: {
  studentId?: string;
  studentName: string;
  toPhone: string;
  type: 'IN'|'OUT';
  whenText: string;
}) {
  const academy = process.env.ACADEMY_NAME || 'OOO 학원';
  const channel = process.env.NOTIFY_PROVIDER || 'mock';
  const message = opts.type === 'IN'
    ? `${opts.studentName}학생, (${opts.whenText})에 ${academy}에 출석하였습니다.`
    : `${opts.studentName}학생, (${opts.whenText})에 ${academy}에 하원하였습니다.`;

  let ok = true, providerId: string|undefined, error: string|undefined;
  if (channel === 'mock') {
    console.log('[MOCK NOTIFY]', { to: opts.toPhone, message });
  } else {
    // TODO: 알림톡/SMS 실제 연동
  }

  await prisma.notifyLog.create({
    data: {
      studentId: opts.studentId,
      type: opts.type,
      channel,
      toPhone: opts.toPhone,
      message,
      success: ok,
      providerId,
      error
    }
  });

  return { ok, message };
}
