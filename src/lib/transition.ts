import type { FadeParams } from "svelte/transition"

interface FadeParamsFn {
	in: FadeParams
	out: FadeParams
	(duration: number): { in: FadeParams; out: FadeParams }
}

export const fadeParams = ((duration: number) => {
	return {
		in: {
			duration,
			delay: duration,
		},
		out: { duration },
	}
}) as FadeParamsFn

fadeParams.in = { duration: 150, delay: 150 }
fadeParams.out = { duration: 150 }
