import React, {useContext, useEffect, useState} from 'react';
import {Select} from '@airtable/blocks/ui';
import {ActionsContext} from './index';

export const CollaboratorSelector = ({handleChangeCollaborator}) => {
	let actions = useContext(ActionsContext);
	let collaborators = actions.collaborators.map(collaborator => ({
		value: collaborator.id,
		label: collaborator.name,
	}));
	collaborators = [{value: null, label: 'Anyone'}, ...collaborators];

	const [collaborator, setCollaborator] = useState(collaborators[0].value);

	useEffect(() => {
		handleChangeCollaborator(collaborator);
	}, [collaborators]);

	return (
		<Select
			options={collaborators}
			value={collaborator}
			onChange={newValue => setCollaborator(newValue)}
		/>
	)
}
