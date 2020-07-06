import React, {Fragment, useContext, useState} from 'react';

import {Box, Button, CollaboratorToken, ConfirmationDialog, Dialog, FormField, Input, SelectButtons, Switch, Text, loadCSSFromString, useRecords, useViewMetadata} from '@airtable/blocks/ui';
import {session} from '@airtable/blocks';

import {Typeahead} from 'react-typeahead';

import {ActionsContext, ViewsContext} from './index';
import {CollaboratorSelector} from './CollaboratorSelector';
import {PageList} from './PageList';
import {Textarea} from './Textarea';

export const QuestionCenter = ({view, handlePageClicked, style}) => {
	let actions = useContext(ActionsContext);

	let {pagesTable, commentsTable} = useContext(ViewsContext);

	let pages = useRecords(pagesTable);

	const viewMetadata = useViewMetadata(view);
	let typeField = viewMetadata.allFields.filter(field => field.name === 'Type')[0];

	let questionOption = typeField.options.choices.filter(option => option.name === 'question')[0];
	let answerOption = typeField.options.choices.filter(option => option.name === 'answer')[0];
	
	const QUESTION_TYPE_ID = questionOption.id;
	const ANSWER_TYPE_ID = answerOption.id;

	let records = useRecords(view);
	let myRecords = records.filter(record => {
		let assignee = record.getCellValue('Assignee');
		return (assignee && assignee.id === session.currentUser.id);
	});

	let recentQuestionsView = commentsTable.getViewByNameIfExists('All Recent Questions');
	let recentQuestions = useRecords(recentQuestionsView);

	let answeredQuestionsView = commentsTable.getViewByNameIfExists('Answered Questions');
	let answeredQuestions = useRecords(answeredQuestionsView);

	const filters = {
		all: records,
		mine: myRecords,
		recent: recentQuestions,
		answered: answeredQuestions,
	};

	const options = [
		{
			value: 'all',
			label: `Unanswered (${records.length})`
		},
		{
			value: 'mine',
			label: `For Me (${myRecords.length})`
		},
		{
			value: 'answered',
			label: `Answered (${answeredQuestions.length})`
		},
	];
	const [value, setValue] = useState(options[0].value);

	const [showQuestionDialog, setShowQuestionDialog] = useState(false);
	const [showAnswerQuestionDialog, setShowAnswerQuestionDialog] = useState(false);
	const [showAnswerSection, setShowAnswerSection] = useState(false);
	const [answer, setAnswer] = useState('');
	const [includePage, setIncludePage] = useState(false);
	const [pageSearchQuery, setPageSearchQuery] = useState('');
	const [selectedPage, setSelectedPage] = useState(null);

	const [selectedQuestion, setSelectedQuestion] = useState();

	const [question, setQuestion] = useState();
	const [collaborator, setCollaborator] = useState();

	const handleChangeCollaborator = (newCollaborator) => {
		setCollaborator(newCollaborator);
	}

	const handleConfirmAddQuestion = () => {
		setShowQuestionDialog(false);
		
		actions.addComment({
			'Text': question,
			'Type': {id: QUESTION_TYPE_ID},
			'Assignee': collaborator ? {id: collaborator} : null,
		});
	}

	const handleCloseAddQuestion = () => {
		setShowQuestionDialog(false);
	}

	const handleCloseDialog = () => {
		setShowAnswerQuestionDialog(false);
		setShowAnswerSection(false);
	}

	const handleQuestionClicked = (question) => {
		setSelectedQuestion(question);
		setShowAnswerQuestionDialog(true);
	}

	const handleFollowClicked = () => {
		console.log('clicked');
	}

	const handleAnswerClicked = () => {
		console.log('clicked');
		setShowAnswerSection(true);
	}

	const handleSubmitAnswer = async () => {
		let commentID = await actions.addComment({
			'Text': answer,
			'Type': {id: ANSWER_TYPE_ID},
			'Page': [{id: selectedPage.id}],
		})

		let previousAnswers = selectedQuestion.getCellValue('Answers') || [];

		actions.updateComment(selectedQuestion, {
			'Answers': [{id: commentID}, ...previousAnswers]
		});
	}

	const handleTypeaheadSelection = (option) => {
		console.log('selected');
		setSelectedPage(option);
	}

	const filterTypeaheadOption = (inputValue, option) => {
		let title = option.getCellValueAsString('Title').toLowerCase();
		return title.includes(inputValue.toLowerCase());
	}

	const displayTypeaheadOption = (option, index) => {
		let title = option.getCellValueAsString('Title');
		return title;
	}

	const typeaheadCSS = `
	.answer-question-dialog {
		overflow: visible;
	}

	.typeahead input {
		font-size: 13px;
    height: 32px;
    line-height: 21px;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 3px;
    box-sizing: border-box;
    font-family: -apple-system,system-ui,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';
    font-weight: 400;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    outline: none;
    border: none;
    color: hsl(0,0%,20%);
    background-color: hsl(0,0%,95%);
    width: 100%;
    margin-top: 8px;
	}

	.typeahead ul {
		list-style: none;
		margin-top: 2px;
		margin-bottom: 0;
		padding-left: 0;
		border-radius: 3px;
		max-height: 90px;
		width: 368px;
		overflow: scroll;
		background-color: hsl(0,0%,95%);
		position: absolute;
		line-height: 24px;
	}

	.typeahead a {
		text-decoration: none;
		color: black;
	}

	.typeahead li {
		padding-left: 12px;
	}

	.typeahead li.hover,
	.typeahead li:hover {
		background-color: hsl(0,0%,90%);
		cursor: pointer;
	}
	`;
	loadCSSFromString(typeaheadCSS);

	return (
		<Box style={style}>
			<Box display="flex">
				<SelectButtons
					value={value}
					options={options}
					onChange={newValue => setValue(newValue)}
					maxWidth={590}
				/>

				<Button
					variant="primary"
					marginLeft={2}
					onClick={() => setShowQuestionDialog(true)}
					disabled={!commentsTable.hasPermissionToCreateRecord()}
				>
					Ask a question
				</Button>
			</Box>

			<PageList
				view={view}
				records={filters[value]}
				handlePageClicked={handlePageClicked}
				onClick={handleQuestionClicked}
			/>

			{
				showQuestionDialog &&
				<ConfirmationDialog
					title="Ask a question"
					body={
						<Fragment>
							<FormField label="What would you like to know?">
								<Textarea onChange={(event) => setQuestion(event.target.value)}/>
							</FormField>

							<FormField label="Who might know the answer?">
								<CollaboratorSelector handleChangeCollaborator={handleChangeCollaborator}/>
							</FormField>
						</Fragment>
					}
					onConfirm={handleConfirmAddQuestion}
					onCancel={handleCloseAddQuestion}
				/>
			}

			{
				showAnswerQuestionDialog &&
				<Dialog
					className="answer-question-dialog"
					width="400px"
					children={
						<Fragment>
							<Dialog.CloseButton />
							<Box display="flex" marginBottom={2}>
								<CollaboratorToken
									marginRight={1}
									collaborator={selectedQuestion.getCellValue('Author')}/> asked:
							</Box>
							<Box
								border="default"
								borderRadius="large"
								backgroundColor="lightGray2"
								padding={2}
								marginBottom={2}
							>
								{selectedQuestion.getCellValue('Text')}
							</Box>
							{/*
							<Box>
								{
									selectedQuestion.selectLinkedRecordsFromCell('Answers').map(answer => (
										<Fragment>
											<Box display="flex" marginBottom={2}>
												<CollaboratorToken
													marginRight={1}
													collaborator={answer.getCellValue('Author')}/> answered:
											</Box>
											<Box
												border="default"
												borderRadius="large"
												backgroundColor="lightGray2"
												padding={2}
												marginBottom={2}
											>
												{answer.getCellValue('Text')}
											</Box>
										</Fragment>
									))
								}
							</Box>
							*/}
							
							<Box
								display={showAnswerSection ? "none" : "flex"}
								justifyContent="flex-end"
							>
								<Button
									marginRight={2}
									onClick={handleFollowClicked}
									disabled={!commentsTable.hasPermissionToUpdateRecord()}
								>
									Follow
								</Button>

								<Button
									variant="primary"
									onClick={handleAnswerClicked}
									disabled={!commentsTable.hasPermissionToCreateRecord()}
								>
									Add an answer
								</Button>
							</Box>

							<Box
								display={showAnswerSection ? "flex" : "none"}
								flexDirection="column"
							>
								
								<Text marginTop={3} marginBottom={2}>Your answer:</Text>
								<Textarea onChange={(event) => setAnswer(event.target.value)}/>

								<Switch
									value={includePage}
									onChange={(newValue) => setIncludePage(newValue)}
									label="Include a page"
									marginTop={2}
									width="auto"
								/>

								{
									includePage &&
									<Box>

										<Typeahead
											className="typeahead"
											placeholder="Search for a page"
											options={pages}
											onOptionSelected={(option) => handleTypeaheadSelection(option)}
											filterOption={filterTypeaheadOption}
											displayOption={displayTypeaheadOption}
										/>
										{/*}
										<Input
											value={pageSearchQuery}
											onChange={(event) => setPageSearchQuery(event.target.value)}
											placeholder="Search for a page"
											marginTop={2}
										/>
										*/}
									</Box>
								}

								<Button
									variant="primary"
									onClick={handleSubmitAnswer}
									marginTop={2}
								>
									Submit
								</Button>
							</Box>

						</Fragment>
					}
					onClose={handleCloseDialog}
				/>
			}
		</Box>
	)
}
