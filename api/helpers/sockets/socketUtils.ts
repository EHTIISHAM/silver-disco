import { notifyWebhookUpdate, notifyRaceUpdate, notifyGameStatusUpdate } from "../../service/games";

export const getSocketIO = () => {
  return (global as any).socketIO;
};

export const sendWebhookNotification = async (data: any) => {
  const io = getSocketIO();
  if (io) {
    await notifyWebhookUpdate(io, data);
  }
};

export const sendRaceNotification = async (data: any) => {
  const io = getSocketIO();
  if (io) {
    await notifyRaceUpdate(io, data);
  }
};

export const sendGameStatusNotification = async (data: any) => {
  const io = getSocketIO();
  if (io) {
    await notifyGameStatusUpdate(io, data);
  }
};
