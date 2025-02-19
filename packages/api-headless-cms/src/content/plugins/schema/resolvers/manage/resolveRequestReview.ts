import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { CmsContentEntryResolverFactory as ResolverFactory } from "../../../../../types";

type ResolveRequestReview = ResolverFactory<any, { revision: string }>;

export const resolveRequestReview: ResolveRequestReview =
    ({ model }) =>
    async (root, args, { cms }) => {
        try {
            const entry = await cms.entries.requestReview(model, args.revision);

            return new Response(entry);
        } catch (e) {
            return new ErrorResponse(e);
        }
    };
