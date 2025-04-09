export interface Radio<Args extends [] = [], Return = void> {
	emitter(...args: Args): Return | undefined
	reciever(cb: (...args: Args) => Return): void
}

export function createRadio<Args extends [] = [], Return = void>(): Radio<Args, Return> {
	let _cb: ((...args: Args) => Return) | undefined
	return {
		emitter(...args) {
			return _cb?.(...args)
		},
		reciever(cb) {
			_cb = cb
		},
	}
}
