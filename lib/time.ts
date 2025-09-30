import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
dayjs.extend(utc); dayjs.extend(tz);

const ZONE = process.env.TIMEZONE || 'Asia/Seoul';
export const nowKST = () => dayjs().tz(ZONE);
export const fmtKST = (d: Date, f='YYYY-MM-DD HH:mm') => dayjs(d).tz(ZONE).format(f);
