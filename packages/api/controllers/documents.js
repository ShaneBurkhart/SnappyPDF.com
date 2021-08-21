const models = require("../models")
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const uuid = require("uuid").v4;
const queue = require("lambda-queue");

const AWS_BUCKET = process.env.AWS_BUCKET;
const AWS_REGION = process.env.AWS_REGION;

exports.getDocument = async (req, res) => {
	const { documentUuid } = req.form
	const document = await models.Document.findOne({ where: { uuid: documentUuid }})
	if (!document) return res.status(422).send("Document not found")
	res.json(document)
}

exports.createDocument = async (req, res) => {
	const { s3Url, filename } = req.form
	const document = await models.Document.create({ 
		s3Url, filename, startedPipelineAt: Date.now()
	})
	if (!document) return res.status(422).send("Could not create document")

	queue.startSplitPdf({
		's3Key': encodeURIComponent(document.s3Url),
		'objectId': document.uuid
	});

	res.json(document)
}

exports.generatePresignedURL = (req, res) => {
	const { filename, mime } = req.form
	const id = uuid()
	const s3Key = `documents/${id}_${filename}`;
	const expiresInSeconds = 60 * 5;

	console.log(filename, mime)

	const url = s3.getSignedUrl('putObject', {
		Bucket: AWS_BUCKET,
		Key: s3Key,
		ContentType: mime,
		ContentDisposition: `attachment; filename='${filename}'`,
		ACL: "public-read",
		Expires: expiresInSeconds
	}, (err, url) => {
		if (err) console.log(err)
		if (err) return res.status(422).send("Could not initiate upload");

		const encodedKey = `documents/${id}_${encodeURIComponent(filename)}`;

		res.json({
			presignedURL: url,
			awsURL: `https://${AWS_BUCKET}.s3-${AWS_REGION}.amazonaws.com/${encodedKey}`,
		});
	})
}

exports.pipelineWebhooks = (req, res) => {
	console.log("FORM", req.form)
	res.send("Completed")
}