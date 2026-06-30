import { 
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3"; 


const s3 = new S3Client({
  endpoint: `https://s3.${process.env.B2_REGION}.backblaze2.com`,
  region: process.env.B2_REGION!,
})

const Bucket = process.env.B2_BUCKET!;

export const b2 = {
  upload: (key: string, html: string) => 
    s3.send(new PutObjectCommand({
      Bucket,
      Key: key,
      Body: html,
      ContentType: "text/html"
    })),

  fetch: async (key: string) => {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket,
      Key: key
    }))
    return await Body?.transformToString()
  },

  delete: (key: string) =>
    s3.send(new DeleteObjectCommand({
      Bucket,
      Key: key
    }))
}
