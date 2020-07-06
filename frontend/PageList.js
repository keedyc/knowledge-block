import React, {useEffect} from 'react';

import {
	Box,
	RecordCard,
	RecordCardList,
	Text,
	useRecords
} from '@airtable/blocks/ui';

export const PageList = ({view, records, onClick}) => {
	if (!records) {
		records = useRecords(view);
	}

	const style = {
		flex: 5,
		padding: '8px',
  };

  const handleClick = (reocrd) => {
  	console.log(record);
  }

	return (
		<Box style={style}>
			{
				records.map(record => (
					<RecordCard
						key={record.id}
						record={record}
						view={view}
						onClick={() => onClick(record)}
						marginBottom={3}
					/>
				))
			}
			{/*
				// For some reason, RecordCards don't always load immediately,
				// when using RecordCardList instead of an array of RecordCards 🤔
				<RecordCardList
					records={records}
					view={view}
					onRecordClick={(record, index) => handlePageClicked(record)}
				/>
			*/}
		</Box>
	)
}
