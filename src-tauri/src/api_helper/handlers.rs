use super::types::{ApiState, RequestConfig, ResponseData};
use reqwest::{
    header::{HeaderMap, HeaderName, HeaderValue},
    Certificate, ClientBuilder,
};
use std::fs;
use tauri::{command, State};

#[tauri::command]
pub async fn send_request(
    state: State<'_, ApiState>,
    config: RequestConfig,
) -> Result<ResponseData, String> {
    let mut client_builder = ClientBuilder::new();

    if let Some(cert_path) = config.cert_path {
        if let Some(key_path) = config.key_path {
            let cert_bytes =
                fs::read(&cert_path).map_err(|e| format!("Failed to read certificate: {}", e))?;
            let key_bytes =
                fs::read(&key_path).map_err(|e| format!("Failed to read private key: {}", e))?;

            let cert = Certificate::from_pem(&cert_bytes)
                .map_err(|e| format!("Failed to create certificate: {}", e))?;
            client_builder = client_builder.add_root_certificate(cert);
        }
    }

    if let Some(ca_path) = config.ca_path {
        let ca_cert_bytes =
            fs::read(&ca_path).map_err(|e| format!("Failed to read CA certificate: {}", e))?;
        let ca_cert = Certificate::from_pem(&ca_cert_bytes)
            .map_err(|e| format!("Failed to parse CA certificate: {}", e))?;
        client_builder = client_builder.add_root_certificate(ca_cert);
    }

    if let Some(skip) = config.skip_verification {
        client_builder = client_builder.danger_accept_invalid_certs(skip);
    }

    let client = client_builder
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let mut headers = HeaderMap::new();
    for (key, value) in config.headers {
        let header_name = HeaderName::from_bytes(key.as_bytes())
            .map_err(|e| format!("Invalid header name: {}", e))?;
        let header_value =
            HeaderValue::from_str(&value).map_err(|e| format!("Invalid header value: {}", e))?;
        headers.insert(header_name, header_value);
    }

    let mut request = client
        .request(
            config
                .method
                .parse()
                .map_err(|e| format!("Invalid HTTP method: {}", e))?,
            &config.url,
        )
        .headers(headers);

    if let Some(body) = config.body {
        request = request.body(body);
    }

    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    let headers = response
        .headers()
        .iter()
        .map(|(name, value)| (name.to_string(), value.to_str().unwrap_or("").to_string()))
        .collect();
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(ResponseData {
        status,
        headers,
        body,
    })
}
