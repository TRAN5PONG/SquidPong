import Zeroact, { Fiber, ZeroactElement } from "./lib/Zeroact";
import { createDom } from "./lib/Zeroact/dom/createDom";
import { updateDom } from "./lib/Zeroact/dom/updateDom";
import { useState } from "./lib/Zeroact";
import { SvgIcon } from "./components/Svg/Svg";
import { commitWork, performUnitOfWork, reconcileChildren, workLoop } from "./lib/Zeroact/core/fiber";



const SimpleDom = () => {
	return (
		<div id="App">
			<h1>Hello Zeroact</h1>
			<p>This is a simple DOM created with Zeroact.</p>
		</div>
	)
}


let CurrentRootFiber : Fiber = {
	type: undefined,
	dom : document.getElementById("app")!,
	props : {
		children : [SimpleDom()],
	},
}

reconcileChildren(CurrentRootFiber, CurrentRootFiber.props.children);
console.log(CurrentRootFiber);

// const Fb : Fiber | null = performUnitOfWork(WorkInProgress);

// console.log(Fb);


// Zeroact.render(<SimpleDom />, document.querySelector<HTMLDivElement>("#app")!);



// Zeroact.render(<App />, document.querySelector<HTMLDivElement>("#app")!);
