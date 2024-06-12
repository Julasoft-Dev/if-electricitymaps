/* eslint-disable prettier/prettier */
import * as dayjs from 'dayjs';
import axios from 'axios';

import {ERRORS} from '../../util/errors';
import {buildErrorMessage} from '../../util/helpers';

import {PluginInterface, PluginParams} from '../types/interface';
import {KeyValuePair, ConfigParams} from '../types/common';

const {AuthorizationError, InputValidationError, APIRequestError} = ERRORS;
const BASE_URL = 'https://api.electricitymap.org/v3';


export const ElectricityMaps = (globalConfig: ConfigParams): PluginInterface => {

    const metadata = {kind: 'execute'};
    const errorBuilder = buildErrorMessage(ElectricityMaps.name);

    let authorizationHeader = '';

    const get_carbon_intensity = async (longitude: number, latitude: number, start: dayjs.Dayjs, end: dayjs.Dayjs, use_latest: boolean): Promise<KeyValuePair[]> => {
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new InputValidationError(
                errorBuilder({
                    message: 'Longitude and Latitude are required for the Electricity Maps API.',
                    scope: 'input',
                })
            )
        }
        const parameters = {
            lon: longitude,
            lat: latitude,
            start: start,
            end: end
        }
        if (end.diff(start, 'days') > 10) {
            throw new InputValidationError(
                errorBuilder({
                    message: 'The maximum duration is 10 days for the Electricity Maps API.',
                    scope: 'input',
                })
            )
        }
        let url = '';
        if (use_latest) {
            url = `${BASE_URL}/carbon-intensity/latest`;
        } else {
            url = `${BASE_URL}/carbon-intensity/past-range`;
        }

        return axios.get(
            url,
            {
                params: parameters,
                headers: {
                    'auth-token': authorizationHeader,
                }
            }
        ).then((response: any) => {
                if (response.status !== 200) {
                    throw new APIRequestError(
                        errorBuilder({
                            message: `Error: ${JSON.stringify(response.status)}`,
                        })
                    );
                }

                const data = response.data;

                // Check if data is an array or an object
                if (!use_latest) {
                    return data.map((carbon_intensity_data: KeyValuePair) => {
                        return {
                            datetime: carbon_intensity_data.datetime,
                            value: carbon_intensity_data.carbonIntensity,
                        };
                    });
                } else {
                    // Handle the case where data is a single object
                    return {
                        datetime: data.datetime,
                        value: data.carbonIntensity,
                    };
                }
            }
        )
    }

    const execute = async (inputs: PluginParams[]): Promise<PluginParams[]> => {
        const token = globalConfig.token;
        if (!token) {
            throw new AuthorizationError(
                errorBuilder({
                    message: 'Missing token',
                    scope: 'authorization',
                })
            );
        }

        let use_latest = true;
        if ('use_latest' in globalConfig){
            use_latest = globalConfig.use_latest;
        }


        authorizationHeader = `auth-token: ${token}`;

        return Promise.all(inputs.map(async (model_param) => {
            let unit = 'gCO2eq/kWh';
            let power_consumption = model_param.power_consumption;
            if (!model_param.power_consumption) {
                power_consumption = 1;
                unit = 'gCO2eq';
            }
            const start = dayjs(model_param.timestamp);
            const end = start.add(model_param.duration, 'second');

            const geolocation = model_param.geolocation.split(',');
            const longitude = geolocation[0];
            const latitude = geolocation[1];
            const carbon_intensities: any = await get_carbon_intensity(longitude, latitude, start, end, use_latest);

            const hours = Math.floor(model_param.duration / 3600);
            const blocs = [...Array(hours).keys()];
            // Calculate for each full hour the ratio of the hour that is in the bloc
            const hourly_ratios = blocs.map((hour) => {
                // this is the first hourly bloc, the ratio is the time between the start and the next hour.
                if (hour === 0) {
                    return start.add(1, 'hour').startOf('hour').diff(start, 'second') / 3600;
                }
                // this is the last hourly bloc, the ratio is the time between the start of the hour and the end.
                if (hour === hours - 1) {
                    return end.diff(start.add(hour, 'hour').startOf('hour'), 'second') / 3600;
                }
                return 1;
            });

            let total_carbon_intensity = 0;
            if (use_latest) {
                total_carbon_intensity += carbon_intensities.value;
            } else {
                carbon_intensities.forEach((carbon_intensity: any, index: any) => {
                    total_carbon_intensity += carbon_intensity.value * hourly_ratios[index];
                });
            }

            return {
                ...model_param,
                carbon_intensity: total_carbon_intensity * power_consumption,
                unit: unit
            };
        }));
    }

    return {
        metadata,
        execute,
    };
}
