# Contact Form via AWS Lambda + SES — Implementation Plan

**Goal:** Replace the public email address on the contact page with a form that sends email via an AWS Lambda function, so Martin's address is never exposed in the HTML.

**Architecture:** HTML form in `contact.njk` → fetch POST to API Gateway HTTP API → Lambda → SES → Martin's inbox. Lambda deployed via CloudFormation in the infrastructure repo. API Gateway URL injected into the frontend at build time.

**Tech Stack:** Node.js Lambda, AWS SDK v3 (`@aws-sdk/client-ses`), API Gateway v2 (HTTP API), CloudFormation, existing Gulp + Nunjucks frontend, existing `contact-form.ts` JS.

---

## Context — read before starting

**Repos:**
- Frontend: `/home/maul/Web Development/Work/Froulik/website`
- Infrastructure: `/home/maul/Web Development/Work/Froulik/infrastructure`

**Existing patterns to follow:**
- CloudFormation stacks live in `infrastructure/frontend/staging.yml` and `production.yml` — new backend stack goes in `infrastructure/backend/staging.yml` and `production.yml`
- Lambda code is released via the same `martinfroulik-release` S3 bucket already used for the website zip. `general.yml` already has `ReleaseReadPolicy` for this.
- Frontend build injects runtime config via `configureFrontend` in `infrastructure/frontend/gulpfile.ts` — `backendUrl` is already a variable there
- `website/scripts/components/contact-form.ts` already handles form submission, success/error states — it just needs a form in the HTML and an `action` URL
- Frontend locale keys for form validation were previously deleted (they came from Strapi originally) — they need to be re-added to `locale/cs.yml` and `locale/en.yml`

---

## Task 1: Verify SES identity (manual, one-time — do first, takes time)

- [ ] In AWS Console → SES → Verified identities → add `froulikmartin@gmail.com`
- [ ] Check inbox and click the verification link
- [ ] If sending to non-verified recipient addresses (i.e. any user email): request SES production access (removes sandbox restriction). Go to SES → Account dashboard → Request production access. Takes 24h.
- [ ] Note: for now Lambda sends TO `froulikmartin@gmail.com` (verified), reply-to is set to the user's submitted email — sandbox is fine for this pattern.

---

## Task 2: Lambda function

**Files to create:**
- `infrastructure/contact-lambda/index.mjs` — handler
- `infrastructure/contact-lambda/package.json`

- [ ] Create `infrastructure/contact-lambda/package.json`:
```json
{
  "name": "contact-lambda",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@aws-sdk/client-ses": "^3"
  }
}
```

- [ ] Create `infrastructure/contact-lambda/index.mjs`:
```js
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'eu-central-1' });
const TO_ADDRESS = process.env.TO_ADDRESS;
const ALLOWED_ORIGIN_STAGING = 'https://www.staging.martinfroulik.cz';
const ALLOWED_ORIGIN_PRODUCTION = 'https://www.martinfroulik.cz';

const corsHeaders = (origin) => {
    const allowed = [ALLOWED_ORIGIN_STAGING, ALLOWED_ORIGIN_PRODUCTION];
    const allowedOrigin = allowed.includes(origin) ? origin : ALLOWED_ORIGIN_PRODUCTION;
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
};

export const handler = async (event) => {
    const origin = event.headers?.origin ?? '';
    const headers = corsHeaders(origin);

    if (event.requestContext?.http?.method === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    let body;
    try {
        body = JSON.parse(event.body ?? '{}');
    } catch {
        return { statusCode: 400, headers, body: JSON.stringify('invalid.json') };
    }

    const { name, message, replyTo } = body;

    if (!name?.trim()) return { statusCode: 400, headers, body: JSON.stringify('name.missing') };
    if (!message?.trim()) return { statusCode: 400, headers, body: JSON.stringify('message.missing') };
    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
        return { statusCode: 400, headers, body: JSON.stringify('email.invalid') };
    }

    await ses.send(new SendEmailCommand({
        Destination: { ToAddresses: [TO_ADDRESS] },
        Message: {
            Subject: { Data: `Contact from martinfroulik.cz — ${name}` },
            Body: {
                Text: {
                    Data: `Name: ${name}\nReply-to: ${replyTo ?? '(not provided)'}\n\n${message}`,
                },
            },
        },
        Source: TO_ADDRESS,
        ReplyToAddresses: replyTo ? [replyTo] : [],
    }));

    return { statusCode: 200, headers, body: JSON.stringify('ok') };
};
```

- [ ] Run `npm install` in `infrastructure/contact-lambda/` to install SDK
- [ ] Verify handler locally: `node -e "import('./index.mjs').then(m => m.handler({requestContext:{http:{method:'POST'}}, headers:{origin:'https://www.staging.martinfroulik.cz'}, body: JSON.stringify({name:'Test',message:'Hello',replyTo:'test@example.com'})}).then(console.log))"`

---

## Task 3: Lambda release script

**Files to modify:**
- `infrastructure/package.json` — add build script
- `infrastructure/contact-lambda/` — already created above

- [ ] Add to root `infrastructure/package.json` scripts:
```json
"release:lambda": "cd contact-lambda && npm install --ci && zip -r ../target/contact-lambda.zip . && aws s3 cp ../target/contact-lambda.zip s3://martinfroulik-release/dev/contact-lambda.zip"
```

- [ ] Create `infrastructure/target/` in `.gitignore` if not already ignored

---

## Task 4: CloudFormation — backend stack

**Files to create:**
- `infrastructure/backend/staging.yml`
- `infrastructure/backend/production.yml`

- [ ] Create `infrastructure/backend/staging.yml`:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Martinfroulik Staging Backend

Parameters:
  LambdaS3Key:
    Type: String
    Default: dev/contact-lambda.zip

Resources:
  ContactLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: martinfroulik-staging-contact-lambda
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: ses-send
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: ses:SendEmail
                Resource: '*'

  ContactLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: martinfroulik-staging-contact
      Runtime: nodejs22.x
      Handler: index.handler
      Role: !GetAtt ContactLambdaRole.Arn
      Code:
        S3Bucket: martinfroulik-release
        S3Key: !Ref LambdaS3Key
      Environment:
        Variables:
          TO_ADDRESS: froulikmartin@gmail.com
      Timeout: 10

  ContactApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: martinfroulik-staging-contact
      ProtocolType: HTTP
      CorsConfiguration:
        AllowOrigins:
          - https://www.staging.martinfroulik.cz
          - https://www.martinfroulik.cz
        AllowMethods: [POST, OPTIONS]
        AllowHeaders: [Content-Type]

  ContactApiIntegration:
    Type: AWS::ApiGatewayV2::Integration
    Properties:
      ApiId: !Ref ContactApi
      IntegrationType: AWS_PROXY
      IntegrationUri: !GetAtt ContactLambda.Arn
      PayloadFormatVersion: '2.0'

  ContactApiRoute:
    Type: AWS::ApiGatewayV2::Route
    Properties:
      ApiId: !Ref ContactApi
      RouteKey: POST /contact
      Target: !Sub integrations/${ContactApiIntegration}

  ContactApiStage:
    Type: AWS::ApiGatewayV2::Stage
    Properties:
      ApiId: !Ref ContactApi
      StageName: '$default'
      AutoDeploy: true

  ContactLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ContactLambda
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn: !Sub arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ContactApi}/*/*/contact

Outputs:
  ContactApiUrl:
    Value: !Sub https://${ContactApi}.execute-api.${AWS::Region}.amazonaws.com/contact
    Export:
      Name: martinfroulik-staging-contact-api-url
```

- [ ] Create `infrastructure/backend/production.yml` — same as staging with `staging` → `production` and `dev/` → `stable/` in S3 key default, and only `https://www.martinfroulik.cz` in CORS AllowOrigins

---

## Task 5: Wire backend into infrastructure deploy workflow

**File to modify:** `infrastructure/.github/workflows/frontend.yml`

- [ ] Add deploy backend step before Deploy Artifact:
```yaml
- name: Deploy Backend Infrastructure
  run: aws cloudformation deploy --template-file backend/${{ github.event.inputs.environment }}.yml --stack-name martinfroulik-${{ github.event.inputs.environment }}-backend --capabilities CAPABILITY_NAMED_IAM --region eu-central-1 --no-fail-on-empty-changeset

- name: Release Lambda
  run: npm run release:lambda
  env:
    AWS_DEFAULT_REGION: eu-central-1
```

- [ ] Add Lambda release to the build workflow in `website/.github/workflows/build.yml` — or keep it in the infrastructure workflow. Infrastructure is cleaner since Lambda code lives there.

---

## Task 6: Inject API URL into frontend build

**File to modify:** `infrastructure/frontend/gulpfile.ts`

The `backendUrl` variable already exists in `gulpfile.ts`. The contact API URL just needs to be passed as a template variable to the HTML.

- [ ] In `configureFrontend()`, add `contactApiUrl` alongside existing template vars:
```ts
// get the API URL from CloudFormation stack output
const contactApiUrl = execSync(
    `aws cloudformation describe-stacks --stack-name martinfroulik-${stability}-backend --query "Stacks[0].Outputs[?OutputKey=='ContactApiUrl'].OutputValue" --output text --region eu-central-1`
).toString().trim();

return src(`target/${frontendName}/**/*.html`)
    .pipe(template({ version, robots, googleTagManager, websiteUrl, backendUrl, contactApiUrl }))
    ...
```

- [ ] The `contactApiUrl` is then available as `<%= contactApiUrl %>` in HTML templates

---

## Task 7: Contact form HTML

**File to modify:** `website/html/contact.njk`

- [ ] Replace the bare mailto paragraph with a form. Keep the phone/email display above it as a secondary contact option:
```njk
{% block page_content %}
<section class="container container-fluid">
    <div class="content__inner">
        <h1 class="content__heading">{{ t('contact') }}</h1>

        <form id="contact-form" action="<%= contactApiUrl %>" method="post" class="contact-form">
            <div class="contact-form__field">
                <label for="contact-name">{{ t('form.name') }}</label>
                <input type="text" id="contact-name" name="name" required>
            </div>
            <div class="contact-form__field">
                <label for="contact-email">{{ t('form.email') }}</label>
                <input type="email" id="contact-email" name="replyTo">
            </div>
            <div class="contact-form__field">
                <label for="contact-message">{{ t('form.message') }}</label>
                <textarea id="contact-message" name="message" rows="6" required></textarea>
            </div>
            <div id="successfully-send" class="d-none">{{ t('form.success') }}</div>
            <div id="not-send" class="d-none" data-messages='{"name.missing":"{{ t("name.missing") }}","message.missing":"{{ t("message.missing") }}","email.invalid":"{{ t("email.invalid") }}","unknown":"{{ t("form.unknown.error") }}"}'></div>
            <button type="button" id="contact-form-submit" class="btn btn-primary">{{ t('submit') }}</button>
        </form>

        <div class="contact-info">
            <a href="tel:{{ phone | replace(' ', '') }}">{{ phone }}</a>
        </div>
    </div>
</section>
{% endblock %}
```

- [ ] Update `contact-form.ts` to send JSON instead of FormData (Lambda expects JSON):
```ts
// In extractAndSendForm, replace FormData with JSON:
const data = {
    name: (formElement.elements.namedItem('name') as HTMLInputElement).value,
    message: (formElement.elements.namedItem('message') as HTMLTextAreaElement).value,
    replyTo: (formElement.elements.namedItem('replyTo') as HTMLInputElement).value,
};
return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
});
```

---

## Task 8: Restore locale strings

**Files to modify:** `website/locale/cs.yml`, `website/locale/en.yml`

- [ ] Add to `locale/en.yml`:
```yaml
email.invalid: Email is not valid
form.email: Your email (optional)
form.message: Your message
form.name: Name
form.success: Thank you, your message has been sent!
form.unknown.error: Something went wrong, please try again
message.missing: Message is required
name.missing: Name is required
submit: Send
```

- [ ] Add to `locale/cs.yml`:
```yaml
email.invalid: Email je ve špatném formátu
form.email: Váš email (nepovinné)
form.message: Vaše zpráva
form.name: Jméno
form.success: Děkuji, zpráva byla odeslána!
form.unknown.error: Něco se pokazilo, zkuste to prosím znovu
message.missing: Zpráva je povinná
name.missing: Jméno je povinné
submit: Odeslat
```

---

## Task 9: SCSS — style the form

**File to modify:** `website/scss/main/partials/_contact-form.scss`

- [ ] Check existing `_contact-form.scss` for any reusable styles
- [ ] Add styles for `.contact-form`, `.contact-form__field`, `label`, `input`, `textarea`, `btn-primary` following the existing design system variables from `_themes.scss`

---

## Task 10: End-to-end test

- [ ] Deploy backend stack to staging manually: `aws cloudformation deploy --template-file backend/staging.yml --stack-name martinfroulik-staging-backend --capabilities CAPABILITY_NAMED_IAM --region eu-central-1`
- [ ] Get API URL from stack output: `aws cloudformation describe-stacks --stack-name martinfroulik-staging-backend --query "Stacks[0].Outputs" --region eu-central-1`
- [ ] Test Lambda directly with curl:
```bash
curl -X POST https://<api-id>.execute-api.eu-central-1.amazonaws.com/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Hello","replyTo":"test@example.com"}'
```
- [ ] Push website changes, wait for CI deploy to staging
- [ ] Submit form on staging, verify email arrives at `froulikmartin@gmail.com`
- [ ] Check error states: empty name, empty message, invalid email format

---

## Notes

- Lambda code lives in `infrastructure/contact-lambda/` — not a separate repo
- `node_modules/` in `contact-lambda/` should be gitignored; they get installed at release time
- SES sandbox restriction only affects sending TO unverified addresses — since we always send TO Martin's verified address, sandbox is fine during testing. Only need production access before going live if Martin wants user's email as the To address rather than Reply-To.
- The `execSync` in `configureFrontend` to get the CloudFormation output is the simplest approach — it runs synchronously during the gulp deploy task.
