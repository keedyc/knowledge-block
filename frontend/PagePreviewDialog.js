import React, {Fragment} from 'react';
import {Button, ConfirmationDialog} from '@airtable/blocks/ui';

import {PageViewer} from './PageViewer';

export const PagePreviewDialog = ({pageID, setShowDialog, handleConfirmPreview, handleCancelPreview, handlePageClicked}) => {
	const handleOpenPage = () => {
		setShowDialog(false);
		handlePageClicked(pageID);
	}

	return (
		<ConfirmationDialog
			width="500px"
			title="Verify this page?"
			body={
				<Fragment>
					<PageViewer pageID={pageID}/>
					<Button
						size="small"
						aria-label="Open Page"
						marginTop={2}
						onClick={handleOpenPage}
					>
						Open Page
					</Button>
				</Fragment>
			}
			confirmButtonText="Verify"
			onConfirm={handleConfirmPreview}
			onCancel={handleCancelPreview}
		/>
	)
}
