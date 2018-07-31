import 'whatwg-fetch';
import browser from 'browser-detect';

import * as React from 'react';

import { GitHubIssueBody } from '../../../../../backend/Components/IssueTracker/_shared/Models/GitHubIssueBody';
import DebugIssueResponse, { IssueResponse, ContributerResponse, LabelResponse } from '../../../../../backend/Components/IssueTracker/_shared/Models/GitHubResponses';
import { IssueTrackerRepoInfo } from '../../../../../backend/Components/IssueTracker/IssueTracker';
import { Issue } from './Issue';
import { Form } from './Form';


export interface GitHubProps {
    isActive: boolean
    onClose: (e:React.MouseEvent<HTMLButtonElement>) => void
}

export interface GitHubState {
    createdIssue?: IssueResponse
    lastCreatedIssue?: IssueResponse
    formClasses: string[],
    issues : IssueResponse[]
    contribs : ContributerResponse[]
    labels : LabelResponse[]
    form : GitHubIssueBody
}

export default class IssueTracker extends React.Component<GitHubProps, GitHubState> {
  
    ref: HTMLElement | null;

    constructor(props : any) {
        super(props);

        this.state = {
            issues: [],
            labels: [],
            contribs: [],
            form: {
                title: '',
                body: '',
                labels: [],
                assignee: '',
                milestone: 0, 
            },
            formClasses: []
        };

        this.ref = null;
        this.handleFormSubmit = this.handleFormSubmit.bind(this);  
    }


    render() {
        let activeClass = '';
        if (this.props.isActive) {
            activeClass = 'IssueTracker_isActive'
        }

        return (
            <section ref={ref => this.ref = ref} className={`IssueTracker ${activeClass}`}>
                <div className={`IssueTracker_Inner`}>
                    <h2 className={`h1`}>Please leave your feedback.</h2>
                    {this.renderIssues()}
                    <Form classes={this.state.formClasses} form={this.state.form} onSubmit={this.handleFormSubmit} labels={this.state.labels} contribs={this.state.contribs}></Form>
                    <button className="IssueTracker_CloseButton" onClick={this.props.onClose}>Schließen</button>
                </div>
                {this.renderResponseMessage()}
            </section>
        );
    }

    renderResponseMessage() {
        if (!this.ref) {
            return;
        }
        let ref = this.ref as HTMLElement;
        let message = null;

        
        let handleCloseResponseMessage = (e : Event) => {
            ref.classList.remove('IssueTracker_ResponseMessage-isActive'); 
            ref.classList.add('IssueTracker_ResponseMessage-isInactive'); 

            this.setState(Object.assign(this.state, {
                ...this.state,
                createdIssue: undefined,
                lastCreatedIssue: this.state.createdIssue,
            }));

            document.removeEventListener('click', handleCloseResponseMessage);
        }

        let statusClass = '';
        if (this.state.createdIssue != undefined) {
            this.ref.classList.add('IssueTracker_ResponseMessage-isActive');
            this.ref.classList.remove('IssueTracker_ResponseMessage-isInactive');
            document.addEventListener('click', handleCloseResponseMessage);

            if (this.state.createdIssue.html_url) {
                statusClass = 'IssueTracker_ResponseMessage-Successful';
                message = (
                    <p>
                        Thanks for your feedback<br />
                        Here is the<a target="_blank" href={this.state.createdIssue.html_url}>Link to your Ticket</a>
                    </p>
                );
            } else {
                statusClass = 'IssueTracker_ResponseMessage-Unsuccessful';
                message = (
                    <p>
                        Sorry, something went wrong.<br />
                        It would be awesome if you let me now. <a target="_blank" href="mailto:info@grizzlydotweb.com">info@grizzlydotweb.com</a> 
                    </p>
                )
            }
        } 

        return (
            <div className={`IssueTracker_ResponseMessage ${statusClass}`}>
                {message}
            </div>
        )
    }

    componentDidMount() {
        this.updateStateByFetch();
    }

    updateStateByFetch() {
        this.fetch('/issue_tracker/info')
            .then((response) => response.json())
            .then((json : IssueTrackerRepoInfo) => {
                if (!json.contribs) {
                    return;
                }

                this.setState({
                    ...this.state,
                    ...json
                });
            })
            .catch(err => console.error(err));
    }

    handleFormSubmit(event : React.FormEvent<HTMLFormElement|HTMLButtonElement>, form : GitHubIssueBody) {
        if (this.state.lastCreatedIssue && this.state.lastCreatedIssue.title === form.title) {
            return;
        }

        let submitForm = {
            ...form,
            body: `
# Description

${form.body}

## Browserinformation
| Info |  |
| :-- | :-- |
| Browser | ${browser().name} |
| OS | ${browser().os} |
| Version | ${browser().version} - ${browser().versionNumber} | 
            `
        }; 

        if (form.title.indexOf('DEBUGONLY') !== -1) {
            this.handleCreatedIssue(DebugIssueResponse);
            return event.preventDefault();
        }

        this.setState({
            ...this.state,
            form: {
                title: '',
                body: '',
                labels: [],
                assignee: '',
                milestone: 0,
            }
        });

        this.fetch('/issue_tracker/issues/create', {
                method: "POST",
                body: JSON.stringify(submitForm),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then((response) => response.json())
            .then((json : IssueResponse) => {
                this.handleCreatedIssue(json);
            })
        ;

        return event.preventDefault();
    }

    handleCreatedIssue(issue : IssueResponse) {
        if (!issue.html_url) {
            return;
        }
        let ref = this.ref as HTMLElement;

        let issues = this.state.issues; 
        this.setState(Object.assign(this.state, {
            ...this.state,
            createdIssue: issue,
            issues: issues
        }));
    }

    renderIssues() {
        if (this.state.issues.length <= 0) {
            return null;
        }

        let rendered = [];
        for (let issue of this.state.issues) {
            rendered.push(<Issue key={issue.id} {...issue}/>)
        }
        

        return (
            <div className="IssueTracker_Issues">
                <p>Please check first the tickets below to avoid duplicates</p>
                <div className="IssueTracker_Issues_Inner">
                    {rendered}
                </div>
            </div>
        )
    }

    fetch(route : string, req : RequestInit = {}) {
        let requestInit = {
            ...{ method: 'GET', credentials: 'same-origin' },
            ...req
        }

        return fetch(route, requestInit as RequestInit);
    }
}