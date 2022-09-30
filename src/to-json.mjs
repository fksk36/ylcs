import { pipe, map } from 'rxjs';

const toJson = pipe(
    map((v) => JSON.stringify(v))
);

export default toJson;