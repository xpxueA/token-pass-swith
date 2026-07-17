use std::sync::Arc;

use cc_switch_lib::{import_provider_from_deeplink, parse_deeplink_url, AppState, Database};

#[path = "support.rs"]
mod support;
use support::{ensure_test_home, reset_test_fs, test_mutex};

#[test]
fn new_api_provider_contract_preserves_supported_fields() {
    for app in ["claude", "codex", "gemini"] {
        let url = format!(
            "tokenpassswith://v1/import?resource=provider&app={app}&name=New%20API%20Provider&endpoint=https%3A%2F%2Ftokenpass.cloud%2Fv1&apiKey=sk-test-only&model=model-test&haikuModel=haiku-test&sonnetModel=sonnet-test&opusModel=opus-test&homepage=https%3A%2F%2Ftokenpass.cloud&enabled=true"
        );

        let request = parse_deeplink_url(&url).expect("parse New API provider contract");

        assert_eq!(request.resource, "provider");
        assert_eq!(request.app.as_deref(), Some(app));
        assert_eq!(request.name.as_deref(), Some("New API Provider"));
        assert_eq!(
            request.endpoint.as_deref(),
            Some("https://tokenpass.cloud/v1")
        );
        assert_eq!(request.api_key.as_deref(), Some("sk-test-only"));
        assert_eq!(request.model.as_deref(), Some("model-test"));
        assert_eq!(request.haiku_model.as_deref(), Some("haiku-test"));
        assert_eq!(request.sonnet_model.as_deref(), Some("sonnet-test"));
        assert_eq!(request.opus_model.as_deref(), Some("opus-test"));
        assert_eq!(request.homepage.as_deref(), Some("https://tokenpass.cloud"));
        assert_eq!(request.enabled, Some(true));
    }
}

#[test]
fn new_api_provider_contract_rejects_invalid_scheme_variants() {
    for scheme in ["tokenpassswitch", "tokenpass-swith"] {
        let url = format!(
            "{scheme}://v1/import?resource=provider&app=codex&name=Invalid&endpoint=https%3A%2F%2Ftokenpass.cloud%2Fv1&apiKey=sk-test-only"
        );

        let error = parse_deeplink_url(&url).expect_err("reject misspelled scheme");
        assert!(error.to_string().contains("Invalid scheme"));
    }
}

#[test]
fn new_api_provider_contract_rejects_missing_name() {
    let url = "tokenpassswith://v1/import?resource=provider&app=codex&endpoint=https%3A%2F%2Ftokenpass.cloud%2Fv1&apiKey=sk-test-only";

    let error = parse_deeplink_url(url).expect_err("reject missing required field");
    assert!(error.to_string().contains("Missing 'name' parameter"));
}

#[test]
fn deeplink_import_claude_provider_persists_to_db() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let url = "tokenpassswith://v1/import?resource=provider&app=claude&name=DeepLink%20Claude&homepage=https%3A%2F%2Fexample.com&endpoint=https%3A%2F%2Fapi.example.com%2Fv1&apiKey=sk-test-claude-key&model=claude-sonnet-4&icon=claude&enabled=true";
    let request = parse_deeplink_url(url).expect("parse deeplink url");

    let db = Arc::new(Database::memory().expect("create memory db"));
    let state = AppState::new(db.clone());

    let provider_id = import_provider_from_deeplink(&state, request.clone())
        .expect("import provider from deeplink");

    // Verify DB state
    let providers = db.get_all_providers("claude").expect("get providers");
    let provider = providers
        .get(&provider_id)
        .expect("provider created via deeplink");

    assert_eq!(provider.name, request.name.clone().unwrap());
    assert_eq!(provider.website_url.as_deref(), request.homepage.as_deref());
    assert_eq!(provider.icon.as_deref(), Some("claude"));
    let auth_token = provider
        .settings_config
        .pointer("/env/ANTHROPIC_AUTH_TOKEN")
        .and_then(|v| v.as_str());
    let base_url = provider
        .settings_config
        .pointer("/env/ANTHROPIC_BASE_URL")
        .and_then(|v| v.as_str());
    assert_eq!(auth_token, request.api_key.as_deref());
    assert_eq!(base_url, request.endpoint.as_deref());
    assert_eq!(
        db.get_current_provider("claude")
            .expect("get current Claude provider"),
        Some(provider_id)
    );
}

#[test]
fn deeplink_import_codex_provider_builds_auth_and_config() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let url = "tokenpassswith://v1/import?resource=provider&app=codex&name=DeepLink%20Codex&homepage=https%3A%2F%2Fopenai.example&endpoint=https%3A%2F%2Fapi.openai.example%2Fv1&apiKey=sk-test-codex-key&model=gpt-4o&icon=openai&enabled=true";
    let request = parse_deeplink_url(url).expect("parse deeplink url");

    let db = Arc::new(Database::memory().expect("create memory db"));
    let state = AppState::new(db.clone());

    let provider_id = import_provider_from_deeplink(&state, request.clone())
        .expect("import provider from deeplink");

    let providers = db.get_all_providers("codex").expect("get providers");
    let provider = providers
        .get(&provider_id)
        .expect("provider created via deeplink");

    assert_eq!(provider.name, request.name.clone().unwrap());
    assert_eq!(provider.website_url.as_deref(), request.homepage.as_deref());
    assert_eq!(provider.icon.as_deref(), Some("openai"));
    let auth_value = provider
        .settings_config
        .pointer("/auth/OPENAI_API_KEY")
        .and_then(|v| v.as_str());
    let config_text = provider
        .settings_config
        .get("config")
        .and_then(|v| v.as_str())
        .unwrap_or_default();
    assert_eq!(auth_value, request.api_key.as_deref());
    assert!(
        config_text.contains(request.endpoint.as_deref().unwrap()),
        "config.toml content should contain endpoint"
    );
    assert!(
        config_text.contains("model = \"gpt-4o\""),
        "config.toml content should contain model setting"
    );
    assert_eq!(
        db.get_current_provider("codex")
            .expect("get current Codex provider"),
        Some(provider_id)
    );
}

#[test]
fn deeplink_import_gemini_provider_builds_env_and_activates() {
    let _guard = test_mutex().lock().expect("acquire test mutex");
    reset_test_fs();
    let _home = ensure_test_home();

    let url = "tokenpassswith://v1/import?resource=provider&app=gemini&name=DeepLink%20Gemini&homepage=https%3A%2F%2Fgemini.example&endpoint=https%3A%2F%2Fapi.gemini.example%2Fv1&apiKey=sk-test-gemini-key&model=gemini-test&icon=gemini&enabled=true";
    let request = parse_deeplink_url(url).expect("parse deeplink url");

    let db = Arc::new(Database::memory().expect("create memory db"));
    let state = AppState::new(db.clone());

    let provider_id = import_provider_from_deeplink(&state, request.clone())
        .expect("import provider from deeplink");

    let providers = db.get_all_providers("gemini").expect("get providers");
    let provider = providers
        .get(&provider_id)
        .expect("provider created via deeplink");

    assert_eq!(provider.name, request.name.clone().unwrap());
    assert_eq!(provider.website_url.as_deref(), request.homepage.as_deref());
    assert_eq!(provider.icon.as_deref(), Some("gemini"));
    assert_eq!(
        provider
            .settings_config
            .pointer("/env/GEMINI_API_KEY")
            .and_then(|value| value.as_str()),
        request.api_key.as_deref()
    );
    assert_eq!(
        provider
            .settings_config
            .pointer("/env/GOOGLE_GEMINI_BASE_URL")
            .and_then(|value| value.as_str()),
        request.endpoint.as_deref()
    );
    assert_eq!(
        provider
            .settings_config
            .pointer("/env/GEMINI_MODEL")
            .and_then(|value| value.as_str()),
        request.model.as_deref()
    );
    assert_eq!(
        db.get_current_provider("gemini")
            .expect("get current Gemini provider"),
        Some(provider_id)
    );
}
