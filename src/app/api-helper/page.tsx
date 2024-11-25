'use client'

import { useState, useEffect } from 'react'
import { Send, HomeIcon, Save, Share } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from 'next/link'
import { ApiSidebar } from '@/components/api-helper/sidebar'
import type { InvokeArgs } from '@tauri-apps/api/tauri'
import { HeaderSuggestions } from '@/components/api-helper/header-suggestions'

interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  certPath?: string;
  keyPath?: string;
  caPath?: string;
  skipVerification?: boolean;
}

interface ResponseData {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export default function ApiHelperPage() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [contentType, setContentType] = useState('x-www-form-urlencoded')
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState('')
  const [params, setParams] = useState<Array<{key: string, value: string, enabled: boolean}>>([
    { key: '', value: '', enabled: true }
  ])
  const [headers, setHeaders] = useState<Array<{key: string, value: string, enabled: boolean}>>([
    { key: '', value: '', enabled: true }
  ])
  const [authType, setAuthType] = useState('none')
  const [authToken, setAuthToken] = useState('')
  const [script, setScript] = useState('')
  const [test, setTest] = useState('')
  const [isTauriAvailable, setIsTauriAvailable] = useState(false)

  useEffect(() => {
    const checkTauri = async () => {
      try {
        // Dynamically import Tauri
        await import('@tauri-apps/api')
        setIsTauriAvailable(true)
      } catch (e) {
        console.warn('Tauri not available:', e)
        setIsTauriAvailable(false)
      }
    }

    checkTauri()
  }, [])

  const validateHeaders = (headers: Array<{key: string, value: string, enabled: boolean}>) => {
    const errors: string[] = [];
    const reservedHeaders = ['host', 'content-length', 'origin', 'referer']; // Headers that shouldn't be modified
    const commonHeaders = new Set([
      'accept',
      'accept-charset',
      'accept-encoding',
      'accept-language',
      'authorization',
      'cache-control',
      'content-type',
      'user-agent',
      'x-requested-with'
    ]); // For auto-suggestions later
  
    headers.forEach((header, index) => {
      if (header.enabled) {
        // Check for empty header keys
        if (!header.key && header.value) {
          errors.push(`Header ${index + 1} has a value but no key`);
        }
  
        // Check for empty header values
        if (header.key && !header.value) {
          errors.push(`Header ${index + 1} (${header.key}) has no key`);
        }
  
        // Check for reserved headers
        if (reservedHeaders.includes(header.key.toLowerCase())) {
          errors.push(`Header "${header.key}" is reserved and cannot be modified`);
        }
  
        // Check for duplicate headers
        const duplicateHeaders = headers.filter(h => 
          h.enabled && 
          h.key.toLowerCase() === header.key.toLowerCase() && 
          h.key !== ''
        );
        if (duplicateHeaders.length > 1) {
          errors.push(`Duplicate header key: ${header.key}`);
        }
  
        // Validate header name format (RFC 2616)
        if (header.key && !/^[a-zA-Z0-9!#$%&'*+-.^_`|~]+$/.test(header.key)) {
          errors.push(`Invalid header name format: ${header.key}`);
        }
      }
    });
  
    return errors;
  };


  const handleSend = async () => {
    try {
      if (!isTauriAvailable) {
        throw new Error('Tauri is not available')
      }

      if (!url) {
        throw new Error('URL is required');
      }
  
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

    // TODO: Need to impmement this.
    // // Validate parameters
    // const paramErrors = validateParams(params);
    // if (paramErrors.length > 0) {
    //   throw new Error(`Parameter validation failed:\n${paramErrors.join('\n')}`);
    // }

    // Validate headers
    const headerErrors = validateHeaders(headers);
    if (headerErrors.length > 0) {
      throw new Error(`Header validation failed:\n${headerErrors.join('\n')}`);
    }

       // Log active headers for debugging
       console.log("Active Headers:", headers.filter(h => h.enabled && h.key));


    // Construct URL with params
    const urlObj = new URL(url);
    params.forEach(param => {
      if (param.enabled && param.key) {
        console.log(`Adding param: ${param.key}=${param.value}`);
        urlObj.searchParams.append(param.key, param.value);
      }
    });

    // Construct headers
    const headerObj: Record<string, string> = {};
    headers.forEach(header => {
      if (header.enabled && header.key) {
        console.log(`Adding header: ${header.key}=${header.value}`);
        headerObj[header.key] = header.value;
      }
    });

  // Add content type header if not already set by user
  if (!headers.some(h => h.enabled && h.key.toLowerCase() === 'content-type')) {
    const contentTypeValue = contentType === 'x-www-form-urlencoded' 
      ? 'application/x-www-form-urlencoded'
      : contentType === 'raw' 
        ? 'application/json'
        : contentType === 'binary'
          ? 'application/octet-stream'
          : 'application/graphql';
    
    console.log(`Adding default Content-Type header: ${contentTypeValue}`);
    headerObj['Content-Type'] = contentTypeValue;
  }

   // Add authorization header if needed and not already set
   if (authType === 'bearer' && authToken && 
    !headers.some(h => h.enabled && h.key.toLowerCase() === 'authorization')) {
  console.log('Adding Authorization header');
  headerObj['Authorization'] = `Bearer ${authToken}`;
}

      const config: RequestConfig = {
        method,
        url: urlObj.toString(),
        headers: headerObj,
        body: method !== 'GET' ? requestBody : undefined
      };

    // Log the final request configuration
    console.log("Final Request Config:", {
      ...config,
      headers: Object.entries(config.headers).map(([key, value]) => ({
        key,
        value: key.toLowerCase() === 'authorization' ? '***' : value
      }))
    });

      // Dynamically import invoke
      const { invoke } = await import('@tauri-apps/api')
      const response = await invoke<ResponseData>('send_request', { config })
      setResponse(JSON.stringify(response, null, 2))
    } catch (error) {
      if (error instanceof Error) {
        setResponse(`Error: ${error.message}`)
      } else if (typeof error === 'string') {
        setResponse(`Error: ${error}`)
      } else {
        setResponse('An unknown error occurred')
      }
    }
  }

  const handleParamChange = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newParams = [...params]
    newParams[index] = { ...newParams[index], [field]: value }
    if (index === params.length - 1 && newParams[index].key !== '') {
      newParams.push({ key: '', value: '', enabled: true })
    }
    setParams(newParams)
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers]
    newHeaders[index] = { ...newHeaders[index], [field]: value }
    if (index === headers.length - 1 && newHeaders[index].key !== '') {
      newHeaders.push({ key: '', value: '', enabled: true })
    }
    setHeaders(newHeaders)
  }

  return (
    <div className="flex h-screen">
      <ApiSidebar />
      <div className="flex-1 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <HomeIcon className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">API Helper</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
          <div className="flex gap-2 mb-6">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              className="flex-1"
              placeholder="Enter request URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={handleSend}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
          <Card className="p-4">
            <Tabs defaultValue="params" className="w-full">
              <TabsList className="w-full mb-6 flex-wrap">
                <TabsTrigger value="params" className="flex-1">Params</TabsTrigger>
                <TabsTrigger value="authorization" className="flex-1">Authorization</TabsTrigger>
                <TabsTrigger value="headers" className="flex-1">Headers ({headers.length - 1})</TabsTrigger>
                <TabsTrigger value="body" className="flex-1">Body</TabsTrigger>
                <TabsTrigger value="scripts" className="flex-1">Scripts</TabsTrigger>
                <TabsTrigger value="tests" className="flex-1">Tests</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="params" className="space-y-4">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4">
                  {params.map((param, index) => (
                    <div key={index} className="contents">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={(e) => handleParamChange(index, 'enabled', e.target.checked)}
                          className="mr-2"
                        />
                      </div>
                      <Input
                        placeholder="Parameter"
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                      />
                      <Input
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      />
                      <div className="w-4"></div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="authorization" className="space-y-4">
                <Select value={authType} onValueChange={setAuthType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auth Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Auth</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
                {authType === 'bearer' && (
                  <Input
                    placeholder="Token"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                  />
                )}
              </TabsContent>

              <TabsContent value="headers" className="space-y-4">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-sm font-medium">Request Headers</h3>
    <HeaderSuggestions 
      onSelect={(header) => {
        const newHeaders = [...headers];
        const lastIndex = headers.length - 1;
        if (headers[lastIndex].key === '' && headers[lastIndex].value === '') {
          newHeaders[lastIndex] = { ...header, enabled: true };
        } else {
          newHeaders.push({ ...header, enabled: true });
        }
        setHeaders(newHeaders);
      }}
    />
  </div>
  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4">
    {headers.map((header, index) => (
      <div key={index} className="contents">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={header.enabled}
            onChange={(e) => handleHeaderChange(index, 'enabled', e.target.checked)}
            className="mr-2"
          />
        </div>
        <Input
          placeholder="Header"
          value={header.key}
          onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
        />
        <Input
          placeholder="Value"
          value={header.value}
          onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
        />
        <div className="w-4"></div>
      </div>
    ))}
  </div>
</TabsContent>

              <TabsContent value="body" className="space-y-4">
                <RadioGroup 
                  value={contentType} 
                  onValueChange={setContentType}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="x-www-form-urlencoded" id="urlencoded" />
                    <Label htmlFor="urlencoded">x-www-form-urlencoded</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="raw" id="raw" />
                    <Label htmlFor="raw">raw</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="binary" id="binary" />
                    <Label htmlFor="binary">binary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="graphql" id="graphql" />
                    <Label htmlFor="graphql">GraphQL</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  placeholder="Request body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="min-h-[200px]"
                />
              </TabsContent>

              <TabsContent value="scripts" className="space-y-4">
                <Textarea
                  placeholder="Pre-request Script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
              </TabsContent>

              <TabsContent value="tests" className="space-y-4">
                <Textarea
                  placeholder="Test Script"
                  value={test}
                  onChange={(e) => setTest(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Settings coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Response</h2>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap">
              {response || 'No response yet'}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}

