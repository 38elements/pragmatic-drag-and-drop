// Source: https://github.com/atlassian/react-beautiful-dnd

import type { Position } from '@atlaskit/pragmatic-drag-and-drop/types';

import { add, apply, isEqual, origin } from './position';
import type { Scrollable, Viewport } from './types';

type CanPartiallyScrollArgs = {
	max: Position;
	current: Position;
	change: Position;
};

const smallestSigned = apply((value: number) => {
	if (value === 0) {
		return 0;
	}
	return value > 0 ? 1 : -1;
});

type GetRemainderArgs = {
	current: Position;
	max: Position;
	change: Position;
};

// We need to figure out how much of the movement
// cannot be done with a scroll
export const getOverlap = (() => {
	const getRemainder = (target: number, max: number): number => {
		if (target < 0) {
			return target;
		}
		if (target > max) {
			return target - max;
		}
		return 0;
	};

	return ({ current, max, change }: GetRemainderArgs): Position | null => {
		const targetScroll: Position = add(current, change);

		const overlap: Position = {
			x: getRemainder(targetScroll.x, max.x),
			y: getRemainder(targetScroll.y, max.y),
		};

		if (isEqual(overlap, origin)) {
			return null;
		}

		return overlap;
	};
})();

export const canPartiallyScroll = ({
	max: rawMax,
	current,
	change,
}: CanPartiallyScrollArgs): boolean => {
	// It is possible for the max scroll to be greater than the current scroll
	// when there are scrollbars on the cross axis. We adjust for this by
	// increasing the max scroll point if needed
	// This will allow movements backwards even if the current scroll is greater than the max scroll
	const max: Position = {
		x: Math.max(current.x, rawMax.x),
		y: Math.max(current.y, rawMax.y),
	};

	// Only need to be able to move the smallest amount in the desired direction
	const smallestChange: Position = smallestSigned(change);

	const overlap: Position | null = getOverlap({
		max,
		current,
		change: smallestChange,
	});

	// no overlap at all - we can move there!
	if (!overlap) {
		return true;
	}

	// if there was an x value, but there is no x overlap - then we can scroll on the x!
	if (smallestChange.x !== 0 && overlap.x === 0) {
		return true;
	}

	// if there was an y value, but there is no y overlap - then we can scroll on the y!
	if (smallestChange.y !== 0 && overlap.y === 0) {
		return true;
	}

	return false;
};

export const canScrollWindow = (viewport: Viewport, change: Position): boolean =>
	canPartiallyScroll({
		current: viewport.scroll.current,
		max: viewport.scroll.max,
		change,
	});

export const getWindowOverlap = (viewport: Viewport, change: Position): Position | null => {
	if (!canScrollWindow(viewport, change)) {
		return null;
	}

	const max: Position = viewport.scroll.max;
	const current: Position = viewport.scroll.current;

	return getOverlap({
		current,
		max,
		change,
	});
};

export const canScrollScrollable = (scrollable: Scrollable, change: Position): boolean => {
	return canPartiallyScroll({
		current: scrollable.scroll.current,
		max: scrollable.scroll.max,
		change,
	});
};

export const getScrollableOverlap = (scrollable: Scrollable, change: Position): Position | null => {
	if (!canScrollScrollable(scrollable, change)) {
		return null;
	}

	return getOverlap({
		current: scrollable.scroll.current,
		max: scrollable.scroll.max,
		change,
	});
};
