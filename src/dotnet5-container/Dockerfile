FROM public.ecr.aws/lambda/dotnet:latest AS base

FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim as build

WORKDIR "/src/DotNet5Lambda"
COPY . .
RUN dotnet restore "DotNet5Lambda.csproj"
RUN dotnet build "DotNet5Lambda.csproj" --configuration Release --output /app/build

FROM build AS publish
RUN dotnet publish "DotNet5Lambda.csproj" \
            --configuration Release \ 
            --runtime linux-x64 \
            --self-contained false \ 
            --output /app/publish \
            -p:PublishReadyToRun=true  

FROM base AS final
WORKDIR /var/task
COPY --from=publish /app/publish .

CMD [ "DotNet5Lambda::DotNet5Lambda.Function::FunctionHandler" ]