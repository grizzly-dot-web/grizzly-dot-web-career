import * as React from 'react';
import * as check from 'check-types';

import { RandomPackager, PackageItem, PackageBlocker } from '../../../../Helper/PositioningHelper';

export interface ExperienceProps {
	data : any
	show: boolean
	originPosition: { x : number, y : number }|null
	blockingElements : HTMLElement[]
}

export interface ExperienceState {
	data : any
	show: boolean
	originPosition: { x : number, y : number }|null
	blockingElements : HTMLElement[]
}

class Experiences extends React.Component<ExperienceProps, ExperienceState> {

	ref : HTMLElement|null;

	packager : RandomPackager|null

	constructor(props : any) {
		super(props);

		this.ref = null;
		this.packager = null;
		this.state = {
			data: this.props.data,
			show: this.props.show,
			originPosition: this.props.originPosition,
			blockingElements: this.props.blockingElements
		};
	}

	render() {
		let experiences = [];

		if (check.array(this.state.data) == null) {
			return null;
		}

		for (let item of this.state.data) {
			let href = null;
			let target = null;
			let SpecifiedTag = 'span';
	
			if (item != null && check.nonEmptyString(item.url)) {
				href = item.url;
				target = '_blank';
				SpecifiedTag = 'a';
			}
	
			let style = {
				transform: `scale(${item.scaleFactor / 5 + 1})`
			}

			experiences.push((
				<SpecifiedTag key={item.title} className={`experience ${item.type}`} href={href} target={target} style={style}>
					<span className="title">{item.title}</span>
					<span className="appereance-pointer" aria-hidden></span>
				</SpecifiedTag>
			));
		}

		return (
			<div ref={ (ref) => this.ref = ref } className={`experiences`}>
				{experiences}
			</div>
		);
	}
	
	componentDidMount() {
		this.packager = new RandomPackager(this.ref as HTMLElement, {
			
		});
	}

	componentDidUpdate() {
		if (this.packager == null) {
			return;
		}

		if (this.props.show) {
			this.show();
		} else {
			this.packager.reset()
		}
	}

	show() {
		if (this.packager == null) {
			return;
		}

		this.rearrangeExperiences();
		this.packager.show();
	}

	rearrangeExperiences() {
		let container = this.ref as HTMLElement;
		if (this.packager == null) {
			return;
		}

		let blocker = [];
		for (let element of this.props.blockingElements) {
			let item = new PackageItem(element);
			item.margin = {x: 0, y: 0 };
			item.top = element.offsetTop;
			item.left = element.offsetLeft;

			blocker.push(item);
		}

		let headerElement = document.getElementById('page-header') as HTMLElement;
		console.log(headerElement.clientWidth, headerElement.clientHeight)
		let headerBlocker = new PackageBlocker(headerElement.clientWidth, headerElement.clientHeight);
		headerBlocker.top = 0;
		headerBlocker.left = 0;
		blocker.push(headerBlocker);

		this.packager.blockingItems = blocker;

		let originPosition = {
			x: (this.props.originPosition) ? this.props.originPosition.x : 0,
			y: (this.props.originPosition)  ? this.props.originPosition.y : 0
		}

		if (this.packager.items.length <= 0) {
			let experiences = container.querySelectorAll('.experiences .experience');
			for (let element of experiences) {
				let item = this.packager.addItem(element as HTMLElement);	
			}
		}
		
		for (let item of this.packager.items) {
			item.originElement.classList.remove('experience__align-left');
			item.originElement.classList.remove('experience__align-right');
			item.originElement.classList.remove('experience__align-top');
			item.originElement.classList.remove('experience__align-bottom');
			
			if (item.left + (item.originElement.clientWidth / 2) < originPosition.x) {
				item.originElement.classList.add('experience__align-left');
			} else {
				item.originElement.classList.add('experience__align-right');
			}

			if (item.top + (item.originElement.clientHeight / 2) < originPosition.y) {
				item.originElement.classList.add('experience__align-top');
			} else {
				item.originElement.classList.add('experience__align-bottom');
			}
		}

		this.packager.layout()
	}

}

export default Experiences;