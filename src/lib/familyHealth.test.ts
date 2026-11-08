import { describe,it,expect } from 'vitest';
import {latestMetric,healthInputError} from './familyHealth';
describe('Family health records',()=>{
 it('retains the last real measurement when a newer row has another metric',()=>expect(latestMetric([{heart_rate:72},{heart_rate:null,weight_kg:70}],'heart_rate')?.heart_rate).toBe(72));
 it('rejects empty and invalid saturation entries',()=>{expect(healthInputError({})).not.toBeNull();expect(healthInputError({spo2:'101'})).not.toBeNull();expect(healthInputError({spo2:'98'})).toBeNull();});
});