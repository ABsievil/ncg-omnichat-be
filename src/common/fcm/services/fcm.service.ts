import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { MulticastMessage, Notification } from 'firebase-admin/messaging';
import {
    IFcmSendData,
    IFcmSendOptions,
} from 'src/common/fcm/interfaces/fcm.interface';

@Injectable()
export class FcmService {
    // private readonly logger = new Logger(FcmService.name);
    // constructor(private readonly configService: ConfigService) {
    //     this.initializeFirebase();
    // }

    // private initializeFirebase(): void {
    //     try {
    //         if (!admin.apps.length) {
    //             admin.initializeApp({
    //                 credential: admin.credential.cert({
    //                     projectId:
    //                         this.configService.get<string>(
    //                             'firebase.projectId'
    //                         ),
    //                     clientEmail: this.configService.get<string>(
    //                         'firebase.clientEmail'
    //                     ),
    //                     privateKey: this.configService
    //                         .get<string>('firebase.privateKey')
    //                         .replace(/\\n/g, '\n'),
    //                 }),
    //             });
    //         }
    //     } catch (error) {
    //         this.logger.error('Failed to initialize Firebase', error);
    //     }
    // }

    // /**
    //  * @description Gửi thông báo đến nhiều thiết bị
    //  */
    // async sendToMultipleDevices(
    //     notification: Notification,
    //     data: IFcmSendData,
    //     tokens: string[],
    //     options: IFcmSendOptions = {}
    // ): Promise<admin.messaging.BatchResponse> {
    //     if (!Array.isArray(tokens) || tokens.length === 0) {
    //         return;
    //     }

    //     const { useDefaultSound = true } = options;
    //     const channelId = useDefaultSound ? 'default_channel' : 'edu_channel';
    //     const sound = useDefaultSound ? 'default_sound' : 'edu_sound';
    //     const iosSound = useDefaultSound
    //         ? 'default_sound.caf'
    //         : 'edu_sound.caf';

    //     const payload: MulticastMessage = {
    //         notification: {
    //             title: notification.title,
    //             body: notification.body,
    //             ...(notification.imageUrl && {
    //                 imageUrl: notification.imageUrl,
    //             }),
    //         },
    //         data,
    //         tokens: tokens,
    //         android: {
    //             notification: {
    //                 channelId,
    //                 sound,
    //             },
    //         },
    //         apns: {
    //             payload: {
    //                 aps: {
    //                     sound: iosSound,
    //                 },
    //             },
    //         },
    //     };

    //     try {
    //         return await admin.messaging().sendEachForMulticast(payload);
    //     } catch (error) {
    //         this.logger.error('Error sending FCM notification', error);
    //         return;
    //     }
    // }

    // /**
    //  * @description Gửi thông báo đến nhiều thiết bị
    //  */
    // async sendNotification(
    //     title: string,
    //     body: string,
    //     data: IFcmSendData,
    //     tokens: string[],
    //     options: {
    //         imageUrl?: string;
    //         useDefaultSound?: boolean;
    //     } = {}
    // ): Promise<admin.messaging.BatchResponse | null> {
    //     const { imageUrl, useDefaultSound = true } = options;

    //     const notification: Notification = {
    //         title,
    //         body,
    //         ...(imageUrl && { imageUrl }),
    //     };

    //     return this.sendToMultipleDevices(notification, data, tokens, {
    //         useDefaultSound,
    //     });
    // }

    // /**
    //  * @description Gửi thông báo đến HLV
    //  */
    // async sendToCoach(
    //     title: string,
    //     body: string,
    //     tokens: string[],
    //     imageUrl?: string,
    //     data?: IFcmSendData,
    //     useDefaultSound: boolean = true
    // ): Promise<admin.messaging.BatchResponse | null> {
    //     return this.sendNotification(title, body, data, tokens, {
    //         imageUrl,
    //         useDefaultSound,
    //     });
    // }

    // /**
    //  * @description Gửi thông báo đến học viên
    //  */
    // async sendToUser(
    //     title: string,
    //     body: string,
    //     tokens: string[],
    //     imageUrl?: string,
    //     data?: IFcmSendData,
    //     useDefaultSound: boolean = true
    // ): Promise<admin.messaging.BatchResponse | null> {
    //     return this.sendNotification(title, body, data, tokens, {
    //         imageUrl,
    //         useDefaultSound,
    //     });
    // }
}
