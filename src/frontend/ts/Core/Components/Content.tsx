import * as React from 'react';
import Markdown from 'markdown-to-jsx';

import CmsControlledComponent, { CmsState, CmsProps } from '../CmsControlledComponent';
import HtmlTag from './HtmlTag';

export interface TextProps extends CmsProps<string> {
	classes?: string[]
	allowedHeadlineLevel? : 1|2|3|4|5|6;
	requiredUser? : string
	requiredRight? : string,
	forceBlock? : boolean
}

export interface TextState extends CmsState {
	forceBlock : boolean
}

export default class Content extends CmsControlledComponent<TextProps, TextState> {
	getInitialState() {
		return { 
			forceBlock: this.props.forceBlock || false
		};
	}
	render() {
		if (typeof this.props.data !== 'string') {
			throw new Error('Empty Textarea')
		}

		let classes : string[] = [];
		if (this.props.classes) {
			classes = this.props.classes;
		}

		let options : any = {
			overrides: {
			},
		}

		if (this.state.forceBlock) {
			options.forceBlock = this.state.forceBlock;
		}

		if (this.props.allowedHeadlineLevel) {
			options.overrides = Object.assign(options.overrides, this.getOverriddenHeadlines());
		}

		return (
			<Markdown className={`AtomicsCCM_markdown ${classes.join(' ')}`} options={options}>
				{this.props.data}
			</Markdown>
		);
	}

	getOverriddenHeadlines(): any {
		if (!this.props.allowedHeadlineLevel) {
			return {};
		}
	
		let overrides : any = {};
		let allowedHLevel = this.props.allowedHeadlineLevel;
		for (let hLevel = 1; hLevel <= 6; hLevel++) {

			let originalTag = 'h'+ hLevel;
			let newHeadlineTag = 'h' + allowedHLevel;

			if (allowedHLevel > 6) {
				newHeadlineTag = 'span';
			}


			let ovveriddenTagClass = originalTag.charAt(0).toUpperCase() + originalTag.slice(1);
			overrides[originalTag] = {
				component: HtmlTag,
				props: {
					tag: newHeadlineTag,
					className: `AtomicsCCM_tag AtomicsCCM_tag${ovveriddenTagClass}-overridden`,
				},
			};
			
			allowedHLevel++;
		}

		return overrides;	
	}
	
}
