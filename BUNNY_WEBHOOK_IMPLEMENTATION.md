# Bunny.net Stream Webhook Integration Guide

To ensure that video processing statuses synchronize automatically and instantly in the database when transcoding is finished on Bunny.net, we should configure a **Bunny.net Stream Webhook** on the backend.

Below is the complete implementation guide and copy-paste-ready Node.js/NestJS backend code for the backend engineers.

---

## 1. Bunny.net Webhook Specifications

Bunny Stream sends a `POST` request with a JSON payload to your webhook URL whenever a video’s transcoding status changes.

### Webhook Payload Example
```json
{
  "VideoLibraryId": 12345,
  "VideoGuid": "cmqqs9maj00052a6kqkmyv0ty",
  "Status": 3
}
```

### Bunny Status Codes
* **`0`**: Queued (Encoding queued)
* **`1`**: Processing
* **`2`**: Encoding
* **`3`**: **Finished** (Transcoding complete, video is ready!)
* **`5`**: **Failed** (Transcoding failed)

---

## 2. Backend Implementation (NestJS / Express)

Create a new public webhook endpoint `/api/v1/webhooks/bunny` on the backend server.

### NestJS Controller Example

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service'; // Adjust path to database service

interface BunnyWebhookDto {
  VideoLibraryId: number;
  VideoGuid: string;
  Status: number;
}

@Controller('api/v1/webhooks')
export class BunnyWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('bunny')
  @HttpCode(HttpStatus.OK)
  async handleBunnyWebhook(@Body() payload: BunnyWebhookDto) {
    const { VideoGuid, Status } = payload;

    // Find the video asset in the database.
    // If your DB stores Bunny's VideoGuid (or a field mapped to it):
    const video = await this.prisma.video.findFirst({
      where: { bunnyVideoId: VideoGuid }, // Replace with your model's field name
    });

    if (!video) {
      console.warn(`Bunny webhook received for unknown video Guid: ${VideoGuid}`);
      return { success: false, message: 'Video not found' };
    }

    let nextStatus = 'PROCESSING';
    let updateFields: any = {};

    if (Status === 3) {
      // 3 = Finished
      nextStatus = 'READY';
      // Populate absolute playbackUrl and thumbnailUrl if needed
      updateFields = {
        processingStatus: 'READY',
        playbackUrl: `https://iframe.mediadelivery.net/play/${payload.VideoLibraryId}/${VideoGuid}`,
        thumbnailUrl: `https://iframe.mediadelivery.net/play/${payload.VideoLibraryId}/${VideoGuid}/thumbnail.jpg`,
      };
    } else if (Status === 5) {
      // 5 = Failed
      nextStatus = 'FAILED';
      updateFields = {
        processingStatus: 'FAILED',
        failureReason: 'Bunny.net transcoding failed.',
      };
    } else if (Status === 0) {
      nextStatus = 'QUEUED';
      updateFields = { processingStatus: 'QUEUED' };
    } else {
      nextStatus = 'PROCESSING';
      updateFields = { processingStatus: 'PROCESSING' };
    }

    await this.prisma.video.update({
      where: { id: video.id },
      data: updateFields,
    });

    console.log(`Updated video ${video.id} status to ${nextStatus} via Bunny Webhook.`);
    return { success: true };
  }
}
```

---

## 3. Bunny Dashboard Configuration

To activate the webhook:
1. Log in to the [Bunny.net Dashboard](https://panel.bunny.net/).
2. Navigate to **Stream** -> **Video Libraries**.
3. Select your Video Library.
4. Go to **API & Webhooks** (or **Webhook Settings**) in the left sidebar.
5. In the **Webhook URL** field, enter your backend webhook endpoint:
   `https://bentlabkids-api-bxzh.onrender.com/api/v1/webhooks/bunny`
6. Click **Save**.
