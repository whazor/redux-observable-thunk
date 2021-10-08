import { Action, createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { multiMatch } from "./filterActions";

describe("multiMatch", () => {
    it("should filter correct actions", () => {

        // // test 
        const m1 = createAction<number>("p1");
        const m2 = createAction<{test?:string, blaat: string}|undefined>("p2");
        const m3 = createAction("p3");


        const x = {type: "p3"} as Action<any>;
        expect(multiMatch(m3, m1, m2)(x)).toBe(true);
        if(multiMatch(m3, m1, m2)(x)) {
            const payload: number|{test?:string, blaat: string}|undefined = x.payload;
            expect(payload).toBe(undefined);
            expect(x.type).toBe("p3");
        }

        const fetchUserById = createAsyncThunk<
            string,
            void,
            {
                rejectValue: string;
                serializedErrorType: {message: string};
            }
        >(  'users/fetchByIdStatus',  async (userId, thunkAPI) => {    
            // example promise
            const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
            return await response.text();
        })

        expect(multiMatch(fetchUserById.rejected)(x)).toBe(false);

        const y = fetchUserById.rejected(new Error("err"), "test");
        expect(multiMatch(fetchUserById.rejected)(y)).toBe(true);
        if(multiMatch(fetchUserById.rejected)(y)) {
            const payload: string|undefined = y.payload;
            expect(payload).toBe(undefined);
            expect(y.type).toBe("users/fetchByIdStatus/rejected");
            expect(y.error.message).toBe("err");
        }
    })
})
