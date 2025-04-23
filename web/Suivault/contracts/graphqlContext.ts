import { graphql } from "@mysten/sui/graphql/schemas/latest"

const queryVaultDataContext = graphql(`
    query queryVaultDataContext($address:SuiAddress!) {
        object(address:$address){
            dynamicFields{
                nodes{
                    name{
                        json
                    }
                    value{
                    ...on MoveValue{
                            json
                        }
                    }
                }
            }
        }
    }
`)

export default queryVaultDataContext;