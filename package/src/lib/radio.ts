export interface Radio<Args extends Array<any> = [], Return = void> {
	emitter(...args: Args): Return | undefined
	reciever(cb: (...args: Args) => Return): void
}

export function createRadio<Args extends Array<any> = [], Return = void>(): Radio<Args, Return> {
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
