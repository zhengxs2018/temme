export interface Configuration {
  productionTip: boolean
}

export const version =  process.env.PKG_VERSION as string

export const config: Configuration = {
  productionTip: false,
};
