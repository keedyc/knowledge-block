import React, {useContext, useState, Fragment} from 'react';
import {ConfirmationDialog, FormField, Input, Select, useRecordById} from '@airtable/blocks/ui';

import {ActionsContext} from './index';
import {ViewsContext} from './index';

import {CollaboratorSelector} from './CollaboratorSelector';

export const PageVerificationDialog = ({pageID, setShowDialog}) => {
	let actions = useContext(ActionsContext);
	let {pagesTable} = useContext(ViewsContext);
	
	let page = useRecordById(pagesTable, pageID);

	const timeframes = [
		{ value: 1, label: 'In a day'},
		{ value: 7, label: 'In a week'},
		{ value: 30, label: 'In a month'},
		{ value: 90, label: 'In a quarter'},
		{ value: 180, label: 'In 6 months'},
		{ value: 365, label: 'In a year'},
		{ value: 'custom', label: 'Custom'},
		{ value: 365000, label: 'Never'},
	];
	const [timeframe, setTimeframe] = useState(timeframes[0].value);

	const [customDate, setCustomDate] = useState('');
	const [collaborator, setCollaborator] = useState();

	const handleChangeCollaborator = (newCollaborator) => {
		setCollaborator(newCollaborator);
	}

	const handleConfirm = () => {
		setShowDialog(false);
		actions.setLatestVerificationToToday(page);
		setNextVerificationDate(timeframe);
		actions.setNextVerifier(page, collaborator);
	}

	const handleCancel = () => {
		setShowDialog(false);
	}

	const setNextVerificationDate = (timeframe) => {
		if (typeof timeframe === "number") {
			actions.setNextVerificationDateRelativeToToday(page, timeframe);
		} else if (timeframe === 'custom') {
			actions.setNextVerificationDate(page, customDate);
		}
	}

	return (
		<ConfirmationDialog
			title="When would you like to review this?"
			body={
				<Fragment>
					<FormField label="Pick a timeframe">
						<Select
							options={timeframes}
							value={timeframe}
							onChange={newValue => setTimeframe(newValue)}
						/>
					</FormField>
					
					{
						timeframe === 'custom' &&
						<FormField label="Pick a date">
							<Input
								type="date"
								value={customDate}
								onChange={event => setCustomDate(event.target.value)}
							/>
						</FormField>
					}

					<FormField label="Pick a teammate">
						<CollaboratorSelector handleChangeCollaborator={handleChangeCollaborator}/>
					</FormField>
				</Fragment>
			}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		/>
	)
}
