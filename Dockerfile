FROM public.ecr.aws/docker/library/node:20.9.0-slim AS builder

WORKDIR /app

COPY . .

# Pass environment variables to the build process
ARG OIDC_ISSUER_URL
ARG OIDC_CLIENT_ID
ARG OIDC_CLIENT_SECRET
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

ENV OIDC_ISSUER_URL=${OIDC_ISSUER_URL}
ENV OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
ENV OIDC_CLIENT_SECRET=${OIDC_CLIENT_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

RUN npm ci && npm run build

FROM public.ecr.aws/docker/library/node:20.9.0-slim AS runner

COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.0 /lambda-adapter /opt/extensions/lambda-adapter

ENV PORT="3000" 
ENV NODE_ENV="production"
ENV OIDC_ISSUER_URL=""
ENV OIDC_CLIENT_ID=""
ENV OIDC_CLIENT_SECRET=""
ENV NEXTAUTH_URL=""
ENV NEXTAUTH_SECRET=""
ENV AWS_LWA_ENABLE_COMPRESSION="true"

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/run.sh ./run.sh
COPY --from=builder /app/amplify_outputs.json ./amplify_outputs.json

RUN ln -s /tmp/cache ./.next/cache

CMD ["./run.sh"]
