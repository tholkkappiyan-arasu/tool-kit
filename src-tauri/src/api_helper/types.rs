use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct RequestConfig {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub cert_path: Option<String>,
    pub key_path: Option<String>,
    pub ca_path: Option<String>,
    pub skip_verification: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ResponseData {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
}

pub struct ApiState {
    pub client: Client,
}

impl ApiState {
    pub fn new() -> Result<Self, reqwest::Error> {
        let client = Client::builder().build()?;
        Ok(Self { client })
    }
}
