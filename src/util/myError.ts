export const ErrorType = {
    exists: 'Already exists',
    notFound: 'Not Found',
    notVerify: 'Verify Fail',
}

export class MyError extends Error {
    constructor(type: string, public readonly payload: object) {
        super(type)
    }
}