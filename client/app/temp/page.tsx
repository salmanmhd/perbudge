"use client"

import { useState } from "react"

function fakeApi(name: string, succeed: boolean, delay = 1200) {
    return new Promise<string>((resolve, reject) => {
        setTimeout(() => {
            if (succeed) {
                resolve(`API ${name} succeeded`)
            } else {
                reject(new Error(`API ${name} failed`))
            }
        }, delay)
    })
}

function timeoutPromise(ms: number) {
    return new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout reached")), ms)
    })
}

export default function TempPage() {
    const [logs, setLogs] = useState<string[]>([])

    function appendLog(text: string) {
        setLogs((current) => [...current, `${new Date().toLocaleTimeString()}: ${text}`])
    }

    async function handleSuccessWithTryCatch() {
        appendLog("Start success with try/catch")

        try {
            const result = await fakeApi("success", true, 1000)
            appendLog(result)
        } catch (error) {
            appendLog("Caught error in try/catch")
            console.error(error)
        }

        appendLog("Finished success with try/catch")
    }

    async function handleFailureWithoutTryCatch() {
        appendLog("Start failure WITHOUT try/catch")

        const result = await fakeApi("failure", false, 1000)
        appendLog(`This never runs: ${result}`)

        appendLog("Finished failure WITHOUT try/catch")
    }

    async function handleFailureWithTryCatch() {
        appendLog("Start failure WITH try/catch")

        try {
            const result = await fakeApi("failure", false, 1000)
            appendLog(result)
        } catch (error) {
            appendLog("Caught error in try/catch")
            console.error(error)
        }

        appendLog("Finished failure WITH try/catch")
    }

    async function handleTimeoutCase() {
        appendLog("Start timeout case")

        try {
            const result = await Promise.race([
                fakeApi("slow", true, 3000),
                timeoutPromise(1500),
            ])
            appendLog(String(result))
        } catch (error) {
            appendLog("Promise.race rejected: " + (error instanceof Error ? error.message : "unknown"))
            console.error(error)
        }

        appendLog("Finished timeout case")
    }

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold">Promise behavior demo</h1>

            <div className="space-y-4">
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-4">
                    <h2 className="text-xl font-semibold">What this page shows</h2>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                        <li>How a dummy API promise resolves successfully.</li>
                        <li>What happens when an async function rejects without `try/catch`.</li>
                        <li>How `try/catch` catches promise rejection and keeps the component in control.</li>
                        <li>How `Promise.race()` can implement a timeout for slow operations.</li>
                    </ul>
                    <p className="mt-3 text-sm text-slate-600">
                        Note: the failure button without `try/catch` will reject the promise and leave the error unhandled inside that function, so the next log line is skipped and the browser console may show an unhandled rejection warning.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <button className="rounded-xl bg-blue-600 px-4 py-3 text-white" onClick={handleSuccessWithTryCatch}>
                        Success with try/catch
                    </button>
                    <button className="rounded-xl bg-orange-600 px-4 py-3 text-white" onClick={handleFailureWithoutTryCatch}>
                        Failure without try/catch
                    </button>
                    <button className="rounded-xl bg-red-600 px-4 py-3 text-white" onClick={handleFailureWithTryCatch}>
                        Failure with try/catch
                    </button>
                    <button className="rounded-xl bg-violet-600 px-4 py-3 text-white" onClick={handleTimeoutCase}>
                        Timeout with Promise.race()
                    </button>
                </div>

                <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                    <h2 className="text-xl font-semibold">Console-like log</h2>
                    <div className="mt-3 max-h-80 overflow-y-auto rounded-lg bg-slate-950 p-3 text-sm text-white">
                        {logs.length === 0 ? (
                            <p className="text-slate-400">Click a button to see the promise behavior here.</p>
                        ) : (
                            logs.map((log, index) => (
                                <div key={index} className="mb-2 break-words">{log}</div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
