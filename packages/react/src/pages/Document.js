import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useClient from "../util/useClient"

const Document = (props) => {
	const { documentUuid } = useParams()
	const [loading, setLoading] = useState(true)
	const [document, setDocument] = useState(null)

	const bouncer = useClient(null)
	const getDocumentRequest = bouncer.get("/api/documents/" + documentUuid)

	console.log(document)

	useEffect(() => {
		getDocumentRequest.sendRequest(null, doc => {
			setDocument(doc)	
		}, err => {
			alert(err)
		})
	}, [])

	return (
		<>
			Document {documentUuid}
		</>
	)
}

export default Document