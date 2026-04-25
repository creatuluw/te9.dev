<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import {
        Button,
        Tabs,
        Label,
        Tooltip,
        Modal,
        Drawer,
    } from "$lib/components";
    import {
        Loader2,
        Mail,
        Search,
        Check,
        ExternalLink,
        ListOrdered,
        ChevronDown,
        Trash2,
        SendHorizontal,
        SquarePen,
        Download,
    } from "lucide-svelte";
    import { navigationStore } from "$lib/stores/navigationStore";
    import { toastStore } from "$lib/stores/toastStore";
    import * as formbricksService from "$lib/services/formbricksService";
    import * as employeeService from "$lib/services/employeeService";
    import type { Survey, Response } from "$lib/schemas/formbricks";
    import type { Employee } from "$lib/schemas/employee";
    import { getUserMessage } from "$lib/types/errors";
    import surveyConfig from "./survey-config.json";

    let surveys = $state<Survey[]>([]);
    let selectedSurvey = $state<Survey | null>(null);
    let employees = $state<Employee[]>([]);
    let responses = $state<Response[]>([]);
    let selectedEmployeeIds = $state<Array<string | number>>([]);
    let searchTerm = $state("");
    let subject = $state("");
    let message = $state("");
    let additionalEmails = $state("");
    let loading = $state(true);
    let loadingDetail = $state(false);
    let loadingEmployees = $state(false);
    let loadingResponses = $state(false);
    let responsesLoaded = $state(false); // Track if we've attempted to load responses
    let sending = $state(false);
    let error = $state<string | null>(null);
    let expandedRows = $state<Set<string>>(new Set());

    // Modal states
    let deleteModalOpen = $state(false);
    let resendModalOpen = $state(false);
    let deleteResponseId = $state<string | null>(null);
    let selectedResponseEmail = $state<string>("");
    let selectedResponseName = $state<string>("");
    let deletingResponse = $state(false);
    let resendingResponse = $state(false);
    let savingResponse = $state(false);

    // Edit drawer state (managed by URL)
    let selectedResponse = $state<Response | null>(null);
    let editFormData = $state<Record<string, unknown>>({});

    // Derive edit drawer state from URL params
    const editDrawerParam = $derived(
        $page.url.searchParams.get("editResponse"),
    );
    const editDrawerOpen = $derived(editDrawerParam !== null);
    const selectedResponseId = $derived(editDrawerParam);

    // Question mapping for display
    type QuestionMap = Record<string, string>;
    let questionMap = $state<QuestionMap>({});
    // Question order array to preserve form order
    let questionOrder = $state<string[]>([]);

    // Survey configuration type
    type SurveyEmailConfig = {
        name: string;
        emailSubject: string;
        emailMessage: string;
    };

    /**
     * Load email template for a survey from survey-config.json or use fallback
     */
    function loadEmailTemplateForSurvey(
        surveyId: string,
        surveyName: string,
    ): { subject: string; message: string } {
        const config =
            surveyConfig.surveys?.[
                surveyId as keyof typeof surveyConfig.surveys
            ];

        if (config) {
            return {
                subject: config.emailSubject,
                message: config.emailMessage,
            };
        }

        // Fallback template for surveys without configuration
        return {
            subject: `${surveyName}`,
            message: `Beste collega,\n\nHierbij de link naar het formulier voor ${surveyName}. Vul dit formulier zo snel mogelijk in.\n\nKlik op deze knop "open het formulier" om het formulier te openen.\n\nAlvast bedankt voor het invullen!\n\nMet vriendelijke groet,\n\nTeam Hoi Pippeloi`,
        };
    }

    // Get active tab from URL param
    const tabParam = $derived($page.url.searchParams.get("tab"));
    const activeTabFromUrl = $derived(tabParam || "versturen");

    onMount(async () => {
        await loadSurveys();
    });

    async function loadSurveys() {
        loading = true;
        navigationStore.startPageLoading();
        error = null;

        const result = await formbricksService.getAllSurveys();

        if (result.success) {
            // Filter to only show surveys with status 'inProgress'
            surveys = result.value.filter(
                (survey) => survey.status === "inProgress",
            );
        } else {
            error = "Kon surveys niet laden";
            toastStore.add("Kon surveys niet laden", "error");
        }

        loading = false;
        navigationStore.stopPageLoading();
    }

    // Track currently loading ID to prevent duplicate loads
    let loadingSurveyId = $state<string | null>(null);

    // Watch for URL param changes and load survey when id is present
    $effect(() => {
        // Don't try to load details until the list has finished loading
        if (loading) {
            return;
        }

        const surveyId = $page.url.searchParams.get("id");

        if (surveyId) {
            // Only load if we don't already have this survey selected and we're not already loading it
            if (
                (!selectedSurvey || selectedSurvey.id !== surveyId) &&
                loadingSurveyId !== surveyId
            ) {
                loadSurveyById(surveyId);
            }
        } else {
            // Clear selection when id param is removed (but not if we're currently loading)
            if (selectedSurvey && !loadingSurveyId) {
                selectedSurvey = null;
            }
        }
    });

    async function loadSurveyById(id: string) {
        // Prevent duplicate loads
        if (loadingSurveyId === id) {
            return;
        }

        loadingSurveyId = id;
        loadingDetail = true;
        navigationStore.startPageLoading();

        try {
            const result = await formbricksService.getSurveyById(id);

            if (result.success) {
                selectedSurvey = result.value;

                // Reset responses state when loading a new survey
                responses = [];
                responsesLoaded = false;
                loadingResponses = false;

                // Build question map from survey questions
                buildQuestionMap(selectedSurvey);

                // Initialize email subject and message from config or fallback
                const emailTemplate = loadEmailTemplateForSurvey(
                    id,
                    result.value.name,
                );
                subject = emailTemplate.subject;
                message = emailTemplate.message;
                // Load employees when survey is loaded
                await loadEmployees();
            } else {
                const errorMessage = result.error
                    ? getUserMessage(result.error)
                    : "Kon survey details niet laden";
                toastStore.add(errorMessage, "error");

                if (import.meta.env.DEV) {
                    console.error(
                        "[formbricks] Failed to load survey:",
                        id,
                        result.error,
                    );
                }

                // Clear the URL param if loading failed
                const newUrl = new URL($page.url);
                newUrl.searchParams.delete("id");
                goto(newUrl.pathname + newUrl.search, { replaceState: true });
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Kon survey details niet laden";
            toastStore.add(errorMessage, "error");

            if (import.meta.env.DEV) {
                console.error("[formbricks] Error loading survey:", id, error);
            }

            // Clear the URL param if loading failed
            const newUrl = new URL($page.url);
            newUrl.searchParams.delete("id");
            goto(newUrl.pathname + newUrl.search, { replaceState: true });
        } finally {
            loadingDetail = false;
            loadingSurveyId = null;
            navigationStore.stopPageLoading();
        }
    }

    function buildQuestionMap(survey: Survey) {
        const map: QuestionMap = {};
        const order: string[] = [];

        // Add welcomeCard first if it exists in the survey
        if (survey.welcomeCard) {
            const welcomeCard = survey.welcomeCard as Record<string, unknown>;
            let welcomeText = "";

            // Extract headline from welcomeCard
            const headline = welcomeCard.headline;
            if (typeof headline === "string") {
                welcomeText = headline;
            } else if (
                headline &&
                typeof headline === "object" &&
                "default" in headline
            ) {
                const h = headline as Record<string, unknown>;
                welcomeText = String(h.default || "");
            }

            if (welcomeText) {
                // Use a special key for welcomeCard
                const welcomeKey = "welcomeCard";
                map[welcomeKey] = welcomeText;
                order.push(welcomeKey);
            }
        }

        if (survey.questions && Array.isArray(survey.questions)) {
            for (const question of survey.questions) {
                if (typeof question === "object" && question !== null) {
                    const q = question as Record<string, unknown>;
                    const id = q.id as string;

                    // Extract headline - it can be a string or an object with 'default' property
                    let headlineText = "";
                    const headline = q.headline;

                    if (typeof headline === "string") {
                        headlineText = headline;
                    } else if (
                        headline &&
                        typeof headline === "object" &&
                        "default" in headline
                    ) {
                        const h = headline as Record<string, unknown>;
                        headlineText = String(h.default || "");
                    }

                    if (id && headlineText) {
                        map[id] = headlineText;
                        order.push(id);
                    }
                }
            }
        }

        if (import.meta.env.DEV) {
            console.log("[formbricks] Question map built from API:", map);
            console.log(
                "[formbricks] Total questions mapped:",
                Object.keys(map).length,
            );
            console.log("[formbricks] Question order:", order);
        }

        questionMap = map;
        questionOrder = order;
    }

    async function loadEmployees() {
        loadingEmployees = true;
        const result = await employeeService.getAllEmployees();
        if (result.success) {
            // Sort employees by user_id (treating both string and number IDs)
            employees = result.value.sort((a, b) => {
                const aId =
                    typeof a.user_id === "number"
                        ? a.user_id
                        : parseInt(String(a.user_id || 0), 10);
                const bId =
                    typeof b.user_id === "number"
                        ? b.user_id
                        : parseInt(String(b.user_id || 0), 10);
                return aId - bId;
            });
        } else {
            toastStore.add("Kon medewerkers niet laden", "error");
        }
        loadingEmployees = false;
    }

    async function loadResponses() {
        if (!selectedSurvey?.id) {
            loadingResponses = false;
            responses = [];
            responsesLoaded = false;
            return;
        }

        // Prevent multiple simultaneous calls
        if (loadingResponses) {
            if (import.meta.env.DEV) {
                console.log(
                    "[formbricks] Already loading responses, skipping...",
                );
            }
            return;
        }

        loadingResponses = true;
        responsesLoaded = false;
        // Clear previous responses while loading
        responses = [];

        try {
            const result = await formbricksService.getResponsesBySurvey(
                selectedSurvey.id,
            );

            if (result.success) {
                // Responses are already sorted by the service (newest first)
                responses = Array.isArray(result.value) ? result.value : [];
                responsesLoaded = true;

                if (import.meta.env.DEV) {
                    console.log(
                        "[formbricks] Loaded responses:",
                        $state.snapshot(responses).length,
                    );
                }
            } else {
                const errorMessage = result.error
                    ? getUserMessage(result.error)
                    : "Kon responses niet laden";
                toastStore.add(errorMessage, "error");

                if (import.meta.env.DEV) {
                    console.error(
                        "[formbricks] Failed to load responses:",
                        result.error,
                    );
                }
                // Ensure responses is an empty array on error
                responses = [];
                responsesLoaded = true; // Mark as loaded even on error so we show empty state
            }
        } catch (error) {
            // Handle any unexpected errors
            if (import.meta.env.DEV) {
                console.error("[formbricks] Error loading responses:", error);
            }
            toastStore.add(
                "Er is een fout opgetreden bij het laden van responses",
                "error",
            );
            responses = [];
            responsesLoaded = true; // Mark as loaded even on error so we show empty state
        } finally {
            loadingResponses = false;
            if (import.meta.env.DEV) {
                console.log(
                    "[formbricks] Loading complete. loadingResponses:",
                    $state.snapshot(loadingResponses),
                    "responses.length:",
                    $state.snapshot(responses).length,
                    "responsesLoaded:",
                    $state.snapshot(responsesLoaded),
                );
            }
        }
    }

    async function handleEditClick(response: Response) {
        if (!selectedSurvey?.id) return;

        // Open drawer by setting URL param
        const url = new URL($page.url);
        url.searchParams.set("editResponse", response.id);
        await goto(url.pathname + url.search, { noScroll: true });
    }

    // Watch for editResponse URL param changes and load data
    $effect(() => {
        if (editDrawerOpen && selectedResponseId && selectedSurvey?.id) {
            loadResponseForEdit(selectedResponseId);
        } else if (!editDrawerOpen) {
            // Clear state when drawer is closed
            selectedResponse = null;
            editFormData = {};
            savingResponse = false;
        }
    });

    async function loadResponseForEdit(responseId: string) {
        if (!selectedSurvey?.id) return;

        savingResponse = true; // Show loading state

        try {
            // 1. Load fresh survey data to ensure we have latest questions
            const surveyResult = await formbricksService.getSurveyById(
                selectedSurvey.id,
            );
            if (!surveyResult.success) {
                toastStore.add("Kon formulier niet laden", "error");
                closeEditDrawer();
                return;
            }
            const freshSurvey = surveyResult.value;

            // 2. Load fresh response data to ensure we have latest answers
            const responseResult =
                await formbricksService.getResponseById(responseId);
            if (!responseResult.success) {
                const errorMessage = responseResult.error
                    ? getUserMessage(responseResult.error)
                    : "Kon antwoord niet laden";
                toastStore.add(errorMessage, "error");

                if (import.meta.env.DEV) {
                    console.error(
                        "[formbricks] Failed to load response:",
                        responseResult.error,
                    );
                    console.error("[formbricks] Response ID:", responseId);
                }

                closeEditDrawer();
                return;
            }
            const freshResponse = responseResult.value;

            // 3. Set the fresh data
            selectedResponse = freshResponse;

            // 4. Initialize editFormData with ALL survey questions
            // Start with existing response data, then add empty values for unanswered questions
            const formData: Record<string, unknown> = JSON.parse(
                JSON.stringify(freshResponse.data || {}),
            );

            // Add all survey questions to form data if not already present
            if (freshSurvey.questions && Array.isArray(freshSurvey.questions)) {
                for (const question of freshSurvey.questions) {
                    const q = question as Record<string, unknown>;
                    const questionId = q.id as string;
                    const questionType = q.type as string;

                    // Skip questions that don't need user input
                    if (
                        questionType === "cta" ||
                        questionType === "statement"
                    ) {
                        continue;
                    }

                    // Only add if not already in response data
                    if (questionId && !(questionId in formData)) {
                        // Set appropriate default value based on question type
                        if (questionType === "multipleChoiceMulti") {
                            formData[questionId] = [];
                        } else if (questionType === "consent") {
                            formData[questionId] = "dismissed";
                        } else {
                            formData[questionId] = "";
                        }
                    }
                }
            }

            editFormData = formData;

            if (import.meta.env.DEV) {
                console.log("[formbricks] Fresh survey loaded:", freshSurvey);
                console.log(
                    "[formbricks] Fresh response loaded:",
                    freshResponse,
                );
                console.log(
                    "[formbricks] Edit form data (with all questions):",
                    editFormData,
                );
            }
        } catch (error) {
            console.error("[formbricks] Error loading edit data:", error);
            toastStore.add("Fout bij laden van bewerkingsgegevens", "error");
            closeEditDrawer();
        } finally {
            savingResponse = false;
        }
    }

    function closeEditDrawer() {
        // Close drawer by removing URL param
        const url = new URL($page.url);
        url.searchParams.delete("editResponse");
        goto(url.pathname + url.search, { noScroll: true });
    }

    async function saveResponseChanges() {
        if (!selectedResponseId || !selectedResponse) return;

        savingResponse = true;
        const result = await formbricksService.updateResponse(
            selectedResponseId,
            {
                data: editFormData,
                finished: selectedResponse.finished,
            },
        );

        if (result.success) {
            toastStore.add("Antwoord succesvol bijgewerkt", "success");
            // Update the response in the local array
            responses = responses.map((r) =>
                r.id === selectedResponseId ? result.value : r,
            );
            // Reload responses to get fresh data
            await loadResponses();
            closeEditDrawer();
        } else {
            const errorMessage = result.error
                ? getUserMessage(result.error)
                : "Kon antwoord niet bijwerken";
            toastStore.add(errorMessage, "error");

            if (import.meta.env.DEV) {
                console.error(
                    "[formbricks] Failed to update response:",
                    result.error,
                );
            }
        }

        savingResponse = false;
    }

    function handleDeleteClick(responseId: string) {
        deleteResponseId = responseId;
        deleteModalOpen = true;
    }

    function cancelDelete() {
        deleteModalOpen = false;
        deleteResponseId = null;
    }

    async function confirmDelete() {
        if (!deleteResponseId) return;

        deletingResponse = true;
        const result = await formbricksService.deleteResponse(deleteResponseId);

        if (result.success) {
            toastStore.add("Antwoord succesvol verwijderd", "success");
            // Remove from local array
            responses = responses.filter((r) => r.id !== deleteResponseId);
            deleteModalOpen = false;
            deleteResponseId = null;
        } else {
            const errorMessage = result.error
                ? getUserMessage(result.error)
                : "Kon antwoord niet verwijderen";
            toastStore.add(errorMessage, "error");

            if (import.meta.env.DEV) {
                console.error(
                    "[formbricks] Failed to delete response:",
                    result.error,
                );
            }
        }

        deletingResponse = false;
    }

    function handleResendClick(email: string, name: string) {
        selectedResponseEmail = email;
        selectedResponseName = name;
        resendModalOpen = true;
    }

    function cancelResend() {
        resendModalOpen = false;
        selectedResponseEmail = "";
        selectedResponseName = "";
    }

    async function confirmResend() {
        if (!selectedSurvey?.id || !selectedResponseEmail) return;

        resendingResponse = true;

        try {
            // Call server-side API endpoint to send email
            const response = await fetch("/api/formbricks/send-survey-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    surveyId: selectedSurvey.id,
                    employeeIds: [], // No employee IDs, using additionalEmails instead
                    subject: subject,
                    message: message,
                    additionalEmails: [selectedResponseEmail],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[formbricks] Server error:", errorText);
                toastStore.add(
                    `Kon formulier niet versturen naar ${selectedResponseEmail}`,
                    "error",
                );
                resendingResponse = false;
                return;
            }

            const result = await response.json();
            const { sent, failed } = result;

            if (sent > 0) {
                toastStore.add(
                    `Formulier succesvol verstuurd naar ${selectedResponseEmail}`,
                    "success",
                );
                resendModalOpen = false;
                selectedResponseEmail = "";
                selectedResponseName = "";
            } else if (failed > 0) {
                toastStore.add(
                    `Kon formulier niet versturen naar ${selectedResponseEmail}`,
                    "error",
                );
                console.error(
                    "[formbricks] Failed to resend form - email sending failed. Check server logs for details.",
                );
            }
        } catch (error) {
            console.error("[formbricks] Failed to resend form:", error);
            toastStore.add(
                `Kon formulier niet versturen naar ${selectedResponseEmail}`,
                "error",
            );
        } finally {
            resendingResponse = false;
        }
    }

    async function selectSurvey(survey: Survey) {
        // Update URL with survey id
        const newUrl = new URL($page.url);
        newUrl.searchParams.set("id", survey.id);
        goto(newUrl.pathname + newUrl.search, { replaceState: false });
    }

    function closeDetail() {
        // Remove id param from URL
        const newUrl = new URL($page.url);
        newUrl.searchParams.delete("id");
        goto(newUrl.pathname + newUrl.search, { replaceState: false });
        // Reset state
        selectedEmployeeIds = [];
        searchTerm = "";
        subject = "";
        message = "";
        additionalEmails = "";
    }

    // Get public Formbricks base URL for survey preview (not the API proxy)
    function getPublicFormbricksUrl(): string {
        // Always use the actual Formbricks instance URL for public survey links
        return (
            import.meta.env.PUBLIC_FORMBRICKS_URL ||
            "https://formbricks-production-f895.up.railway.app"
        );
    }

    const previewUrl = $derived.by(() => {
        if (!selectedSurvey?.id) return null;
        const baseUrl = getPublicFormbricksUrl();
        return `${baseUrl}/s/${selectedSurvey.id}`;
    });

    // Filter employees based on search and sort by ID
    const filteredEmployees = $derived.by(() => {
        let filtered = employees;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = employees.filter(
                (emp) =>
                    (emp.fullname || emp.name || "")
                        .toLowerCase()
                        .includes(term) ||
                    (emp.hoi_email || emp.email || emp.email_value || "")
                        .toLowerCase()
                        .includes(term),
            );
        }

        // Sort by user_id (treating both string and number IDs) - create new array to avoid mutation
        return [...filtered].sort((a, b) => {
            const aId =
                typeof a.user_id === "number"
                    ? a.user_id
                    : parseInt(String(a.user_id || 0), 10);
            const bId =
                typeof b.user_id === "number"
                    ? b.user_id
                    : parseInt(String(b.user_id || 0), 10);
            return aId - bId;
        });
    });

    const selectedCount = $derived(selectedEmployeeIds.length);
    const selectedEmployees = $derived.by(() =>
        employees.filter(
            (emp) =>
                emp.user_id !== undefined &&
                selectedEmployeeIds.includes(emp.user_id),
        ),
    );
    const allSelected = $derived.by(() => {
        if (filteredEmployees.length === 0) return false;
        return filteredEmployees.every(
            (emp) =>
                emp.user_id !== undefined &&
                selectedEmployeeIds.includes(emp.user_id),
        );
    });
    const someSelected = $derived.by(() => {
        if (allSelected) return false;
        return filteredEmployees.some(
            (emp) =>
                emp.user_id !== undefined &&
                selectedEmployeeIds.includes(emp.user_id),
        );
    });

    function toggleEmployee(userId: string | number | undefined) {
        if (userId === undefined || userId === null) return;
        const index = selectedEmployeeIds.indexOf(userId);
        if (index >= 0) {
            selectedEmployeeIds = selectedEmployeeIds.filter(
                (id) => id !== userId,
            );
        } else {
            selectedEmployeeIds = [...selectedEmployeeIds, userId];
        }
    }

    function toggleSelectAll() {
        if (allSelected) {
            // Deselect all filtered
            const filteredIds = filteredEmployees
                .map((emp) => emp.user_id)
                .filter((id): id is string | number => id !== undefined);
            selectedEmployeeIds = selectedEmployeeIds.filter(
                (id) => !filteredIds.includes(id),
            );
        } else {
            // Select all filtered
            const filteredIds = filteredEmployees
                .map((emp) => emp.user_id)
                .filter((id): id is string | number => id !== undefined);
            const newSelected = [
                ...new Set([...selectedEmployeeIds, ...filteredIds]),
            ];
            selectedEmployeeIds = newSelected;
        }
    }

    async function handleSend() {
        if (sending) {
            return; // Prevent duplicate calls
        }

        // Parse additional emails
        const parsedAdditionalEmails = additionalEmails
            .split(/[\n,;]/)
            .map((email) => email.trim())
            .filter((email) => email.length > 0 && email.includes("@"));

        // Require at least one recipient (employee or additional email)
        if (
            !selectedSurvey?.id ||
            (selectedEmployeeIds.length === 0 &&
                parsedAdditionalEmails.length === 0) ||
            !subject.trim() ||
            !message.trim()
        ) {
            if (
                selectedEmployeeIds.length === 0 &&
                parsedAdditionalEmails.length === 0
            ) {
                toastStore.add(
                    "Selecteer minimaal één medewerker of voeg een e-mailadres toe",
                    "error",
                );
            }
            return;
        }

        sending = true;

        try {
            // Call server-side API endpoint to send emails
            const response = await fetch("/api/formbricks/send-survey-links", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    surveyId: selectedSurvey.id,
                    employeeIds: selectedEmployeeIds,
                    subject: subject.trim(),
                    message: message.trim(),
                    additionalEmails:
                        parsedAdditionalEmails.length > 0
                            ? parsedAdditionalEmails
                            : undefined,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[formbricks] Server error:", errorText);
                toastStore.add("Kon e-mails niet verzenden", "error");
                sending = false;
                return;
            }

            const result = await response.json();
            const { sent, failed } = result;

            // Determine toast type based on results
            let toastType: "success" | "warning" | "error";
            if (sent === 0 && failed > 0) {
                // All emails failed - red error toast
                toastType = "error";
            } else if (failed > 0) {
                // Some failed - yellow warning toast
                toastType = "warning";
            } else {
                // All succeeded - green success toast
                toastType = "success";
            }

            toastStore.add(
                `${sent} e-mail(s) verzonden${failed > 0 ? `, ${failed} mislukt` : ""}`,
                toastType,
            );

            // Log errors when emails failed
            if (failed > 0) {
                console.error(
                    `[formbricks] ${failed} email(s) failed to send. Check server logs for details.`,
                );
            }

            // Clear selected employees and additional emails so user can select different ones and send again
            selectedEmployeeIds = [];
            additionalEmails = "";
        } catch (error) {
            console.error("[formbricks] Failed to send emails:", error);
            toastStore.add("Kon e-mails niet verzenden", "error");
        } finally {
            sending = false;
        }
    }

    function getEmployeeEmail(emp: Employee): string {
        return emp.hoi_email || emp.email || emp.email_value || "";
    }

    function getEmployeeName(emp: Employee): string {
        return emp.fullname || emp.name || "Onbekend";
    }

    function openPreview() {
        if (previewUrl) {
            window.open(previewUrl, "_blank");
        }
    }

    function formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleString("nl-NL", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    }

    function getRowId(response: Response): string {
        return response.id;
    }

    function toggleRow(rowId: string) {
        const newSet = new Set(expandedRows);
        if (newSet.has(rowId)) {
            newSet.delete(rowId);
        } else {
            newSet.add(rowId);
        }
        expandedRows = newSet;
    }

    function isRowExpanded(rowId: string): boolean {
        return expandedRows.has(rowId);
    }

    function getPersonEmail(response: Response): string {
        // First check hidden fields in response data
        if (
            response.data &&
            response.data.email &&
            typeof response.data.email === "string"
        ) {
            return response.data.email;
        }

        // Then check person userId
        if (response.person?.userId) {
            return response.person.userId;
        }

        // Check person attributes
        if (
            response.personAttributes &&
            typeof response.personAttributes === "object"
        ) {
            const attrs = response.personAttributes as Record<string, unknown>;
            if (attrs.email && typeof attrs.email === "string") {
                return attrs.email;
            }
        }

        return "";
    }

    function getPersonName(response: Response): string {
        // First, try to get name from the survey response data
        // Look for "Voor- en achternaam" question
        const nameQuestionId = findQuestionIdByKeywords(["voor", "achternaam"]);
        if (nameQuestionId) {
            const name = getResponseValueById(response, nameQuestionId);
            if (name !== "-") {
                return name;
            }
        }

        // Fallback to person attributes
        if (
            response.person?.attributes &&
            typeof response.person.attributes === "object"
        ) {
            const attrs = response.person.attributes as Record<string, unknown>;
            if (attrs.name && typeof attrs.name === "string") {
                return attrs.name;
            }
        }

        if (
            response.personAttributes &&
            typeof response.personAttributes === "object"
        ) {
            const attrs = response.personAttributes as Record<string, unknown>;
            if (attrs.name && typeof attrs.name === "string") {
                return attrs.name;
            }
        }

        return "Anoniem";
    }

    function getPersonFirstName(response: Response): string {
        // Look for "Voornaam" question
        const firstNameQuestionId = findQuestionIdByKeywords(["voornaam"]);
        if (firstNameQuestionId) {
            const firstName = getResponseValueById(
                response,
                firstNameQuestionId,
            );
            if (firstName !== "-") {
                return firstName;
            }
        }

        // Fallback: try to split full name if available
        const fullName = getPersonName(response);
        if (fullName && fullName !== "Anoniem") {
            const parts = fullName.trim().split(/\s+/);
            return parts[0] || "-";
        }

        return "-";
    }

    function getPersonLastName(response: Response): string {
        // Look for "Achternaam" question
        const lastNameQuestionId = findQuestionIdByKeywords(["achternaam"]);
        if (lastNameQuestionId) {
            const lastName = getResponseValueById(response, lastNameQuestionId);
            if (lastName !== "-") {
                return lastName;
            }
        }

        // Fallback: try to split full name if available
        const fullName = getPersonName(response);
        if (fullName && fullName !== "Anoniem") {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length > 1) {
                return parts.slice(1).join(" ");
            }
        }

        return "-";
    }

    // Helper to get response value by question ID
    function getResponseValueById(
        response: Response,
        questionId: string,
    ): string {
        if (!response.data || !response.data[questionId]) return "-";

        const value = response.data[questionId];
        if (typeof value === "string") return value;
        if (typeof value === "number") return value.toString();
        if (typeof value === "boolean") return value ? "Ja" : "Nee";
        // Handle file upload arrays: extract first URL from single-element arrays
        if (Array.isArray(value)) {
            if (value.length === 1 && typeof value[0] === "string") {
                return value[0];
            }
            // Multi-file: join URLs with newline
            if (
                value.length > 0 &&
                value.every((v: unknown) => typeof v === "string")
            ) {
                return value.join("\n");
            }
        }
        return String(value);
    }

    // Helper to find question ID by matching keywords in the question text
    function findQuestionIdByKeywords(keywords: string[]): string | null {
        for (const [questionId, questionText] of Object.entries(questionMap)) {
            if (typeof questionText !== "string") continue;

            const lowerText = questionText.toLowerCase();
            // Normalize hyphens for matching (replace hyphens with nothing for comparison)
            const normalizedText = lowerText.replace(/-/g, "");
            const matches = keywords.every((keyword) => {
                if (typeof keyword !== "string") return false;
                const normalizedKeyword = keyword
                    .toLowerCase()
                    .replace(/-/g, "");
                // Check both original and normalized versions
                return (
                    lowerText.includes(keyword.toLowerCase()) ||
                    normalizedText.includes(normalizedKeyword)
                );
            });

            if (matches) {
                return questionId;
            }
        }
        return null;
    }

    // Get location from response
    // Question: "Vanuit welke locatie krijg je je salaris betaald?"
    function getLocation(response: Response): string {
        const questionId = findQuestionIdByKeywords([
            "locatie",
            "salaris",
            "betaald",
        ]);
        if (!questionId) return "-";
        return getResponseValueById(response, questionId);
    }

    // Get contract type from response
    // Question: "Wat voor contract heb je?"
    function getContractType(response: Response): string {
        const questionId = findQuestionIdByKeywords([
            "wat",
            "voor",
            "contract",
        ]);
        if (!questionId) return "-";
        return getResponseValueById(response, questionId);
    }

    // Get hours per week from response
    // Questions: "Wat zijn je vaste uren per week?" OR "Wat zijn je minimale uren per week?"
    function getHoursPerWeek(response: Response): string {
        // Try "vaste uren" first
        const vasteUrenId = findQuestionIdByKeywords(["vaste", "uren", "week"]);
        if (vasteUrenId) {
            const hours = getResponseValueById(response, vasteUrenId);
            if (hours !== "-") return hours;
        }

        // Try "minimale uren"
        const minimaleUrenId = findQuestionIdByKeywords([
            "minimale",
            "uren",
            "week",
        ]);
        if (minimaleUrenId) {
            return getResponseValueById(response, minimaleUrenId);
        }

        return "-";
    }

    // Get vacation payout preference
    // Question: "Wil je al je verlof uitbetalen in januari?"
    function getVacationPayout(response: Response): string {
        const payoutQuestionId = findQuestionIdByKeywords([
            "verlof",
            "uitbetalen",
            "januari",
        ]);
        if (!payoutQuestionId) return "-";

        const payoutAnswer = getResponseValueById(response, payoutQuestionId);

        // If yes, return just yes
        if (payoutAnswer === "Ja") {
            return "Ja";
        } else if (payoutAnswer === "Nee") {
            // Check for "Hoeveel uren wil je meenemen naar volgend jaar?" (for vacation)
            // This question appears after "Nee" to vacation payout
            const hoursQuestionId = findQuestionIdByKeywords([
                "hoeveel",
                "uren",
                "meenemen",
            ]);
            if (hoursQuestionId) {
                const hoursToKeep = getResponseValueById(
                    response,
                    hoursQuestionId,
                );
                if (hoursToKeep !== "-") {
                    return `Nee (${hoursToKeep})`;
                }
            }
            return "Nee";
        }

        return payoutAnswer;
    }

    // Get plus hours payout preference
    // Question: "Wil je al je plus-uren uitbetalen in januari?"
    function getPlusHoursPayout(response: Response): string {
        // Try with hyphen first (more common in Dutch)
        let payoutQuestionId = findQuestionIdByKeywords([
            "plus-uren",
            "uitbetalen",
            "januari",
        ]);
        // Fallback to without hyphen
        if (!payoutQuestionId) {
            payoutQuestionId = findQuestionIdByKeywords([
                "plusuren",
                "uitbetalen",
                "januari",
            ]);
        }

        // If we still can't find it, try searching in response data directly
        if (!payoutQuestionId && response.data) {
            for (const [questionId, questionText] of Object.entries(
                questionMap,
            )) {
                if (typeof questionText !== "string") continue;
                const lowerText = questionText.toLowerCase();
                const normalizedText = lowerText.replace(/-/g, "");
                // Check if question contains plus-uren/plusuren, uitbetalen, and januari
                if (
                    (normalizedText.includes("plusuren") ||
                        lowerText.includes("plus-uren")) &&
                    lowerText.includes("uitbetalen") &&
                    lowerText.includes("januari")
                ) {
                    // Check if this question has a value in the response
                    if (
                        response.data[questionId] !== undefined &&
                        response.data[questionId] !== null
                    ) {
                        payoutQuestionId = questionId;
                        break;
                    }
                }
            }
        }

        if (!payoutQuestionId) return "-";

        const payoutAnswer = getResponseValueById(response, payoutQuestionId);

        // If yes, return just yes
        if (payoutAnswer === "Ja") {
            return "Ja";
        } else if (payoutAnswer === "Nee") {
            // Find the plus hours carryover question
            // The question text is "Hoeveel plus-uren wil je meenemen naar volgend jaar?"
            // It should contain "plus-uren" or "plusuren" AND "hoeveel", "uren", "meenemen"
            let plusHoursCarryoverId = findQuestionIdByKeywords([
                "hoeveel",
                "plus-uren",
                "meenemen",
            ]);
            if (!plusHoursCarryoverId) {
                plusHoursCarryoverId = findQuestionIdByKeywords([
                    "hoeveel",
                    "plusuren",
                    "meenemen",
                ]);
            }

            if (plusHoursCarryoverId) {
                const hoursToKeep = getResponseValueById(
                    response,
                    plusHoursCarryoverId,
                );
                if (hoursToKeep !== "-") {
                    return `Nee (${hoursToKeep})`;
                }
            }

            // Fallback: search in response data directly for plus hours carryover
            if (response.data) {
                for (const [questionId, questionText] of Object.entries(
                    questionMap,
                )) {
                    if (typeof questionText !== "string") continue;
                    const lowerText = questionText.toLowerCase();
                    const normalizedText = lowerText.replace(/-/g, "");
                    // Check if question contains plus-uren/plusuren, hoeveel, uren, and meenemen
                    if (
                        (normalizedText.includes("plusuren") ||
                            lowerText.includes("plus-uren")) &&
                        lowerText.includes("hoeveel") &&
                        lowerText.includes("uren") &&
                        lowerText.includes("meenemen")
                    ) {
                        // Check if this question has a value in the response
                        if (
                            response.data[questionId] !== undefined &&
                            response.data[questionId] !== null
                        ) {
                            const hoursToKeep = getResponseValueById(
                                response,
                                questionId,
                            );
                            if (hoursToKeep !== "-") {
                                return `Nee (${hoursToKeep})`;
                            }
                        }
                    }
                }
            }

            // Fallback: find by question order - look for question after plus hours payout that contains "plus-uren" or "plusuren"
            const payoutIndex = questionOrder.indexOf(payoutQuestionId);
            if (payoutIndex !== -1 && payoutIndex < questionOrder.length - 1) {
                for (let i = payoutIndex + 1; i < questionOrder.length; i++) {
                    const nextQuestionId = questionOrder[i];
                    const questionText = questionMap[nextQuestionId];

                    if (typeof questionText === "string") {
                        const lowerText = questionText.toLowerCase();
                        // Check if this question is about plus hours carryover
                        if (
                            (lowerText.includes("plus-uren") ||
                                lowerText.includes("plusuren")) &&
                            lowerText.includes("hoeveel") &&
                            lowerText.includes("uren") &&
                            lowerText.includes("meenemen")
                        ) {
                            const hoursToKeep = getResponseValueById(
                                response,
                                nextQuestionId,
                            );
                            if (hoursToKeep !== "-") {
                                return `Nee (${hoursToKeep})`;
                            }
                        }
                    }
                }
            }

            // Final fallback: search all questions for one that has "plus-uren" or "plusuren" and carryover pattern
            for (const [questionId, questionText] of Object.entries(
                questionMap,
            )) {
                if (typeof questionText !== "string") continue;

                const lowerText = questionText.toLowerCase();
                // Must contain "plus-uren" or "plusuren" to differentiate from vacation carryover
                if (
                    (lowerText.includes("plus-uren") ||
                        lowerText.includes("plusuren")) &&
                    lowerText.includes("hoeveel") &&
                    lowerText.includes("uren") &&
                    lowerText.includes("meenemen")
                ) {
                    const hoursToKeep = getResponseValueById(
                        response,
                        questionId,
                    );
                    if (hoursToKeep !== "-") {
                        return `Nee (${hoursToKeep})`;
                    }
                }
            }

            return "Nee";
        }

        return payoutAnswer;
    }

    // Check if opmerkingen field has text
    function hasOpmerkingen(response: Response): string {
        const opmerkingenQuestionId = findQuestionIdByKeywords(["opmerkingen"]);
        if (!opmerkingenQuestionId) return "Nee";

        const opmerkingenValue = getResponseValueById(
            response,
            opmerkingenQuestionId,
        );

        // Check if the value is not empty and not '-'
        if (
            opmerkingenValue &&
            opmerkingenValue !== "-" &&
            opmerkingenValue.trim().length > 0
        ) {
            return "Ja";
        }

        return "Nee";
    }

    // Get question text by ID
    function getQuestionText(questionId: string): string {
        const text = questionMap[questionId];
        return typeof text === "string" && text.length > 0 ? text : questionId;
    }

    // Get column name for a question from survey-config.json
    function getColumnName(questionId: string): string {
        const surveyId = selectedSurvey?.id;
        if (!surveyId) return getQuestionText(questionId);

        // Access survey config entry (same pattern as loadEmailTemplateForSurvey)
        const surveyConfigEntry =
            surveyConfig.surveys?.[
                surveyId as keyof typeof surveyConfig.surveys
            ];

        // If survey has questions config, find the question and return its columnName
        if (surveyConfigEntry && surveyConfigEntry.questions) {
            const question = surveyConfigEntry.questions.find(
                (q: any) => q.id === questionId,
            );
            return question?.columnName || getQuestionText(questionId);
        }

        // Fall back to question text if no config found
        return getQuestionText(questionId);
    }

    // Detect if a question is PII (Personal Identifiable Information)
    function isPIIQuestion(questionId: string, questionText: string): boolean {
        const lowerText = questionText.toLowerCase();
        const lowerId = questionId.toLowerCase();

        // Common PII field patterns
        const piiPatterns = [
            "naam",
            "voor",
            "achter",
            "voornaam",
            "achternaam",
            "email",
            "e-mail",
            "mail",
            "telefoon",
            "phone",
            "tel",
            "mobiel",
            "adres",
            "address",
            "straat",
            "postcode",
            "stad",
            "geboorte",
            "birth",
            "geboortedatum",
            "buitenlands",
            "bsn",
            "id kaart",
            "id-kaart",
            "paspoort",
            "burgerservicenummer",
            "bsn",
            "burgerservicenr",
            "persoon",
            "personlijk",
            "personal",
        ];

        // Check if any PII pattern matches in question text or ID
        return piiPatterns.some(
            (pattern) =>
                lowerText.includes(pattern) || lowerId.includes(pattern),
        );
    }

    // Get all unique question IDs from all responses
    function getAllUniqueQuestionIds(): string[] {
        const allQuestionIds = new Set<string>();

        responses.forEach((response) => {
            if (response.data && typeof response.data === "object") {
                Object.keys(response.data).forEach((key) =>
                    allQuestionIds.add(key),
                );
            }
        });

        return Array.from(allQuestionIds);
    }

    // Get ordered table columns with PII prioritization
    type TableColumn = {
        id: string;
        label: string;
        isPII: boolean;
    };

    function getTableColumns(): TableColumn[] {
        const allQuestionIds = getAllUniqueQuestionIds();

        // Separate into PII and non-PII fields
        const piiColumns: TableColumn[] = [];
        const nonPIIColumns: TableColumn[] = [];

        // First, add PII columns based on questionOrder
        for (const questionId of questionOrder) {
            if (allQuestionIds.includes(questionId)) {
                const columnName = getColumnName(questionId);
                const questionText = getQuestionText(questionId);
                if (isPIIQuestion(questionId, questionText)) {
                    piiColumns.push({
                        id: questionId,
                        label: columnName,
                        isPII: true,
                    });
                }
            }
        }

        // Then, add non-PII columns based on questionOrder
        for (const questionId of questionOrder) {
            if (allQuestionIds.includes(questionId)) {
                const columnName = getColumnName(questionId);
                const questionText = getQuestionText(questionId);
                if (!isPIIQuestion(questionId, questionText)) {
                    nonPIIColumns.push({
                        id: questionId,
                        label: columnName,
                        isPII: false,
                    });
                }
            }
        }

        // Add remaining columns (not in questionOrder) at the end
        const remainingQuestionIds = allQuestionIds.filter(
            (id) => !questionOrder.includes(id),
        );
        for (const questionId of remainingQuestionIds) {
            const columnName = getColumnName(questionId);
            const questionText = getQuestionText(questionId);
            const isPII = isPIIQuestion(questionId, questionText);
            if (isPII) {
                piiColumns.push({
                    id: questionId,
                    label: columnName,
                    isPII: true,
                });
            } else {
                nonPIIColumns.push({
                    id: questionId,
                    label: columnName,
                    isPII: false,
                });
            }
        }

        // Return PII columns first, then non-PII columns
        return [...piiColumns, ...nonPIIColumns];
    }

    // Get response value for table cell display
    function getResponseValue(response: Response, questionId: string): string {
        return getResponseValueById(response, questionId);
    }

    // Format table cell value - convert URLs to clickable links
    function formatTableValue(value: string): string {
        if (typeof value !== "string") {
            return String(value);
        }
        // Check if value contains multiple URLs (multi-file uploads)
        if (value.includes("\n")) {
            const parts = value.split("\n");
            const allUrls = parts.every(
                (p) =>
                    p.startsWith("http://") ||
                    p.startsWith("https://") ||
                    p.startsWith("/api/"),
            );
            if (allUrls) {
                return parts
                    .map(
                        (url, i) =>
                            `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">bestand ${i + 1}</a>`,
                    )
                    .join(", ");
            }
        }
        // Check if value is a URL (external or proxy)
        if (
            value.startsWith("http://") ||
            value.startsWith("https://") ||
            value.startsWith("/api/formbricks/file-download")
        ) {
            // Extract a display name from the URL if possible
            let label = "link ->";
            try {
                // Try to get filename from the url param or path
                const fileMatch = value.match(
                    /(?:private\/|filename=)([^&?]+)/,
                );
                if (fileMatch) {
                    // Clean up Formbricks file naming: "testpdf--fid--uuid.pdf" → "testpdf.pdf"
                    label = decodeURIComponent(fileMatch[1]).replace(
                        /--fid--[a-f0-9-]+/,
                        "",
                    );
                }
            } catch {
                // ignore parse errors
            }
            return `<a href="${value}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${label}</a>`;
        }
        // Escape HTML for non-URL values
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Get response data entries in the same order as the form questions
    function getOrderedResponseEntries(
        response: Response,
    ): Array<[string, unknown]> {
        if (!response.data || typeof response.data !== "object") {
            return [];
        }

        const data = response.data as Record<string, unknown>;
        const entries: Array<[string, unknown]> = [];

        // First, add welcomeCard if it exists in questionOrder (it should be first)
        // Also check for any welcomeCard-like keys in the data
        const welcomeCardKeys = new Set<string>();

        // Check if welcomeCard is in questionOrder
        if (questionOrder.includes("welcomeCard")) {
            welcomeCardKeys.add("welcomeCard");
        }

        // Also check for any keys in data that match welcomeCard patterns
        for (const key of Object.keys(data)) {
            if (
                key.toLowerCase().includes("welcome") ||
                key.toLowerCase().includes("welkom") ||
                key === "welcomeCard"
            ) {
                welcomeCardKeys.add(key);
            }
        }

        // Add welcomeCard entries first
        for (const welcomeKey of welcomeCardKeys) {
            if (welcomeKey in data) {
                entries.push([welcomeKey, data[welcomeKey]]);
            } else if (
                welcomeKey === "welcomeCard" &&
                selectedSurvey?.welcomeCard
            ) {
                // If welcomeCard is not in response data but exists in survey, add it with survey data
                const welcomeCard = selectedSurvey.welcomeCard as Record<
                    string,
                    unknown
                >;
                const headline = welcomeCard.headline;
                let welcomeText = "";
                if (typeof headline === "string") {
                    welcomeText = headline;
                } else if (
                    headline &&
                    typeof headline === "object" &&
                    "default" in headline
                ) {
                    const h = headline as Record<string, unknown>;
                    welcomeText = String(h.default || "");
                }
                if (welcomeText) {
                    entries.push([welcomeKey, welcomeText]);
                }
            }
        }

        // Then, add entries in the order they appear in the form (excluding welcomeCard)
        for (const questionId of questionOrder) {
            if (questionId !== "welcomeCard" && questionId in data) {
                entries.push([questionId, data[questionId]]);
            }
        }

        // Finally, add any remaining entries that weren't in the question order (excluding welcomeCard)
        for (const [questionId, value] of Object.entries(data)) {
            if (
                !questionOrder.includes(questionId) &&
                !welcomeCardKeys.has(questionId)
            ) {
                entries.push([questionId, value]);
            }
        }

        return entries;
    }

    // Replace recall variables in text with actual values from response data
    function replaceRecallVariables(
        text: string,
        responseData: Record<string, unknown>,
    ): string {
        if (!text) return text;

        // Pattern: #recall:questionId/fallback:defaultValue#
        const recallPattern = /#recall:([^/]+)(?:\/fallback:([^#]*?))?#/g;

        return text.replace(recallPattern, (match, questionId, fallback) => {
            // Get the value from response data
            const value = responseData[questionId];

            // If we have a value, use it
            if (value !== undefined && value !== null && value !== "") {
                return String(value);
            }

            // Otherwise use the fallback (or empty string if no fallback)
            return fallback || "";
        });
    }

    // Define tabs for the detail view
    const detailTabs = [
        { id: "versturen", label: "Versturen" },
        { id: "resultaten", label: "Resultaten" },
    ];

    // Watch for tab changes to load responses when switching to Resultaten tab
    $effect(() => {
        if (
            activeTabFromUrl === "resultaten" &&
            selectedSurvey &&
            !responsesLoaded &&
            !loadingResponses
        ) {
            loadResponses();
        }
    });

    // CSV export function
    function escapeCSVValue(value: string): string {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
        ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    function formatValueForCSV(value: unknown): string {
        if (value === null || value === undefined) return "";
        if (typeof value === "boolean") return value ? "Ja" : "Nee";
        if (typeof value === "object") {
            // For arrays and objects, stringify them
            return JSON.stringify(value);
        }
        return String(value);
    }

    function exportToCSV() {
        if (responses.length === 0) {
            toastStore.add("Geen data om te exporteren", "warning");
            return;
        }

        // Get dynamic table columns (with PII prioritization and survey order)
        const tableColumns = getTableColumns();

        // Build headers: question columns, then metadata columns
        const questionHeaders = tableColumns.map((col) =>
            escapeCSVValue(col.label),
        );
        const metadataHeaders = [
            escapeCSVValue("Aangemaakt"),
            escapeCSVValue("Voltooid"),
        ];
        const headers = [...questionHeaders, ...metadataHeaders];

        // Build rows with all data
        const rows = responses.map((response) => {
            // Question values in table order (PII first, then survey order)
            const questionValues = tableColumns.map((col) => {
                const value = getResponseValue(response, col.id);
                const formattedValue = formatValueForCSV(value);
                return escapeCSVValue(formattedValue);
            });

            // Metadata values
            const metadataValues = [
                escapeCSVValue(formatDate(response.createdAt)),
                escapeCSVValue(response.finished ? "Ja" : "Nee"),
            ];

            return [...questionValues, ...metadataValues];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");
        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        // Generate filename with survey name and date
        const surveyName = selectedSurvey?.name || "formbricks";
        const sanitizedSurveyName = surveyName
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();
        const dateStr = new Date().toISOString().split("T")[0];
        link.setAttribute(
            "download",
            `${sanitizedSurveyName}-resultaten-${dateStr}.csv`,
        );

        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toastStore.add("CSV succesvol geëxporteerd", "success");
    }
</script>

<svelte:head>
    <title>Formbricks - Tools - Kees Pippeloi</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-[90vw]">
    {#if selectedSurvey}
        <!-- Survey detail view with tabs -->
        {#if loadingDetail}
            <div class="flex items-center justify-center py-12">
                <Loader2 class="h-8 w-8 text-zinc-400 animate-spin" />
            </div>
        {:else if error}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">{error}</p>
            </div>
        {:else}
            <div class="flex flex-col" style="height: calc(100vh - 8rem);">
                <!-- Header -->
                <div class="mb-6 pb-4 border-b border-zinc-200 shrink-0">
                    <div class="flex items-start justify-between">
                        <div>
                            <h1
                                class="text-xl font-semibold text-zinc-900 font-aspekta"
                            >
                                {selectedSurvey.name}
                            </h1>
                        </div>
                        <div class="flex items-center gap-2">
                            {#if previewUrl}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onclick={openPreview}
                                >
                                    Preview
                                    <ExternalLink class="h-3 w-3 ml-1" />
                                </Button>
                            {/if}
                            <Button
                                variant="secondary"
                                size="sm"
                                onclick={closeDetail}>Sluiten</Button
                            >
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <Tabs
                    tabs={detailTabs}
                    activeTab={activeTabFromUrl}
                    class="flex-1 flex flex-col min-h-0"
                    ontabchange={async (tabId) => {
                        const url = new URL($page.url);
                        url.searchParams.set("tab", tabId);
                        await goto(url.pathname + url.search, {
                            noScroll: true,
                        });
                    }}
                >
                    {#snippet children({ activeTab }: { activeTab: string })}
                        <div class="flex-1 flex flex-col min-h-0">
                            <!-- Versturen Tab -->
                            <div
                                class="flex-1 flex flex-col min-h-0 pt-6"
                                style:display={activeTab === "versturen"
                                    ? "flex"
                                    : "none"}
                            >
                                <div class="flex-1 overflow-y-auto pb-4">
                                    <!-- Two Column Layout: Employee Selection and Email Composer -->
                                    <div
                                        class="grid grid-cols-1 lg:grid-cols-2 gap-4"
                                    >
                                        <!-- Employee Selection -->
                                        <div
                                            class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
                                        >
                                            <h2
                                                class="text-base font-semibold text-zinc-900 font-aspekta mb-3"
                                            >
                                                Selecteer medewerkers
                                            </h2>

                                            <!-- Search -->
                                            <div class="relative mb-3">
                                                <Search
                                                    class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                                                />
                                                <input
                                                    type="text"
                                                    bind:value={searchTerm}
                                                    placeholder="Zoek op naam of e-mail..."
                                                    class="w-full pl-8 pr-3 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
                                                />
                                            </div>

                                            <!-- Select all -->
                                            <div
                                                class="flex items-center justify-between border-b border-zinc-200 pb-2 mb-3"
                                            >
                                                <button
                                                    type="button"
                                                    onclick={toggleSelectAll}
                                                    class="flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:text-zinc-700"
                                                >
                                                    <div
                                                        class="w-3.5 h-3.5 border-2 rounded border-zinc-300 flex items-center justify-center {allSelected
                                                            ? 'bg-orange-500 border-orange-500'
                                                            : someSelected
                                                              ? 'bg-orange-500/50 border-orange-500'
                                                              : ''}"
                                                    >
                                                        {#if allSelected || someSelected}
                                                            <Check
                                                                class="h-2.5 w-2.5 text-white"
                                                            />
                                                        {/if}
                                                    </div>
                                                    <span
                                                        >{allSelected
                                                            ? "Alles deselecteren"
                                                            : "Alles selecteren"}</span
                                                    >
                                                </button>
                                                <span
                                                    class="text-xs text-zinc-600"
                                                    >{selectedCount} geselecteerd</span
                                                >
                                            </div>

                                            <!-- Employee list -->
                                            <div
                                                class="max-h-80 overflow-y-auto space-y-1.5"
                                            >
                                                {#if loadingEmployees}
                                                    <div
                                                        class="flex items-center justify-center py-6"
                                                    >
                                                        <Loader2
                                                            class="h-5 w-5 text-zinc-400 animate-spin"
                                                        />
                                                    </div>
                                                {:else if filteredEmployees.length === 0}
                                                    <p
                                                        class="text-center text-sm text-zinc-600 py-6"
                                                    >
                                                        Geen medewerkers
                                                        gevonden
                                                    </p>
                                                {:else}
                                                    {#each filteredEmployees as employee (employee.user_id)}
                                                        {@const userId =
                                                            employee.user_id}
                                                        {@const isSelected =
                                                            userId !==
                                                                undefined &&
                                                            selectedEmployeeIds.includes(
                                                                userId,
                                                            )}
                                                        {@const email =
                                                            getEmployeeEmail(
                                                                employee,
                                                            )}
                                                        {@const name =
                                                            getEmployeeName(
                                                                employee,
                                                            )}
                                                        {#if userId !== undefined}
                                                            <label
                                                                class="flex items-center gap-2 p-2 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer {isSelected
                                                                    ? 'bg-orange-50 border-orange-300'
                                                                    : ''}"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onchange={() =>
                                                                        toggleEmployee(
                                                                            userId,
                                                                        )}
                                                                    class="w-3.5 h-3.5 text-orange-500 border-zinc-300 rounded focus:ring-orange-500"
                                                                />
                                                                <div
                                                                    class="flex-1 min-w-0 flex items-center gap-1.5"
                                                                >
                                                                    <span
                                                                        class="text-sm font-medium text-zinc-900"
                                                                        >{name}</span
                                                                    >
                                                                    {#if email}
                                                                        <span
                                                                            class="text-xs text-zinc-500"
                                                                            >•</span
                                                                        >
                                                                        <span
                                                                            class="text-xs text-zinc-600 truncate"
                                                                            >{email}</span
                                                                        >
                                                                    {/if}
                                                                </div>
                                                            </label>
                                                        {/if}
                                                    {/each}
                                                {/if}
                                            </div>
                                        </div>

                                        <!-- Email Composer -->
                                        <div
                                            class="bg-white rounded-lg border border-zinc-200 p-4 shadow-xs"
                                        >
                                            <h2
                                                class="text-base font-semibold text-zinc-900 font-aspekta mb-3"
                                            >
                                                E-mail opstellen
                                            </h2>

                                            <!-- Subject -->
                                            <div class="mb-3">
                                                <label
                                                    for="email-subject"
                                                    class="block text-xs font-medium text-zinc-900 mb-1"
                                                >
                                                    Onderwerp
                                                </label>
                                                <input
                                                    id="email-subject"
                                                    type="text"
                                                    bind:value={subject}
                                                    class="w-full px-2.5 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent"
                                                    placeholder="E-mail onderwerp"
                                                />
                                            </div>

                                            <!-- Message -->
                                            <div class="mb-3">
                                                <label
                                                    for="email-message"
                                                    class="block text-xs font-medium text-zinc-900 mb-1"
                                                >
                                                    Bericht
                                                </label>
                                                <textarea
                                                    id="email-message"
                                                    bind:value={message}
                                                    rows="8"
                                                    class="w-full px-2.5 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent font-inter"
                                                    placeholder="E-mail bericht (de link wordt automatisch toegevoegd)"
                                                ></textarea>
                                                <p
                                                    class="mt-1 text-xs text-zinc-500"
                                                >
                                                    De link naar het formulier
                                                    wordt automatisch aan het
                                                    einde van het bericht
                                                    toegevoegd.
                                                </p>
                                            </div>

                                            <!-- Additional Email Addresses -->
                                            <div class="mb-3">
                                                <label
                                                    for="additional-emails"
                                                    class="block text-xs font-medium text-zinc-900 mb-1"
                                                >
                                                    Extra e-mailadressen
                                                </label>
                                                <textarea
                                                    id="additional-emails"
                                                    bind:value={
                                                        additionalEmails
                                                    }
                                                    rows="2"
                                                    class="w-full px-2.5 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent font-inter"
                                                    placeholder="Voeg extra e-mailadressen toe (gescheiden door komma's of nieuwe regels)"
                                                ></textarea>
                                                <p
                                                    class="mt-1 text-xs text-zinc-500"
                                                >
                                                    Deze adressen ontvangen ook
                                                    de formulierlink. Scheid
                                                    adressen met komma's of
                                                    nieuwe regels.
                                                </p>
                                            </div>

                                            <!-- Preview link info -->
                                            {#if previewUrl}
                                                <div
                                                    class="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3"
                                                >
                                                    <p
                                                        class="text-xs text-blue-900"
                                                    >
                                                        <strong>Let op:</strong> Elke
                                                        medewerker ontvangt een gepersonaliseerde
                                                        link met hun e-mailadres als
                                                        parameter.
                                                    </p>
                                                </div>
                                            {/if}

                                            <!-- Actions -->
                                            <div
                                                class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200"
                                            >
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onclick={closeDetail}
                                                    >Annuleren</Button
                                                >
                                                <Button
                                                    size="sm"
                                                    onclick={handleSend}
                                                    disabled={!subject.trim() ||
                                                        !message.trim() ||
                                                        (selectedCount === 0 &&
                                                            !additionalEmails.trim()) ||
                                                        sending}
                                                >
                                                    <Mail
                                                        class="h-3.5 w-3.5 mr-1.5"
                                                    />
                                                    {#if sending}
                                                        Verzenden...
                                                    {:else}
                                                        {@const additionalCount =
                                                            additionalEmails
                                                                .split(/[\n,;]/)
                                                                .filter((e) =>
                                                                    e
                                                                        .trim()
                                                                        .includes(
                                                                            "@",
                                                                        ),
                                                                ).length}
                                                        {@const totalCount =
                                                            selectedCount +
                                                            additionalCount}
                                                        Versturen ({totalCount})
                                                    {/if}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Resultaten Tab -->
                            <div
                                class="flex-1 flex flex-col min-h-0 pt-6"
                                style:display={activeTab === "resultaten"
                                    ? "flex"
                                    : "none"}
                            >
                                <div class="flex-1 overflow-y-auto pb-4">
                                    {#if loadingResponses}
                                        <div
                                            class="flex items-center justify-center py-12"
                                        >
                                            <Loader2
                                                class="h-8 w-8 text-zinc-400 animate-spin"
                                            />
                                        </div>
                                    {:else if responses.length === 0}
                                        <div
                                            class="bg-white rounded-lg border border-zinc-200 p-12 shadow-xs"
                                        >
                                            <div class="text-center space-y-4">
                                                <ListOrdered
                                                    class="w-12 h-12 text-zinc-400 mx-auto"
                                                />
                                                <p class="text-zinc-600">
                                                    Nog geen antwoorden
                                                    ontvangen voor dit
                                                    formulier.
                                                </p>
                                            </div>
                                        </div>
                                    {:else}
                                        <!-- Response Statistics -->
                                        <div
                                            class="mb-4 flex items-center justify-between"
                                        >
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <Label variant="default"
                                                    >{responses.length} antwo{responses.length !==
                                                    1
                                                        ? "orden"
                                                        : "ord"}</Label
                                                >
                                                <Label variant="success"
                                                    >{responses.filter(
                                                        (r) => r.finished,
                                                    ).length} voltooid</Label
                                                >
                                                <Label variant="warning"
                                                    >{responses.filter(
                                                        (r) => !r.finished,
                                                    ).length} onvoltooid</Label
                                                >
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onclick={exportToCSV}
                                            >
                                                <Download
                                                    class="h-3.5 w-3.5 mr-1.5"
                                                />
                                                Exporteer CSV
                                            </Button>
                                        </div>

                                        <!-- Response Table -->
                                        {@const tableColumns =
                                            getTableColumns()}
                                        <div
                                            class="bg-white rounded-lg border border-zinc-200 shadow-xs overflow-hidden"
                                        >
                                            <div class="overflow-x-auto">
                                                <table class="w-full">
                                                    <thead
                                                        class="bg-zinc-50 border-b border-zinc-200"
                                                    >
                                                        <tr>
                                                            {#each tableColumns as column}
                                                                <th
                                                                    class="px-3 py-2 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta {column.isPII
                                                                        ? 'bg-orange-50/30'
                                                                        : ''}"
                                                                >
                                                                    {column.label}
                                                                </th>
                                                            {/each}
                                                            <th
                                                                class="px-3 py-2 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta w-10"
                                                            >
                                                                <Tooltip
                                                                    text="Opnieuw versturen"
                                                                    position="bottom"
                                                                >
                                                                    <SendHorizontal
                                                                        size={14}
                                                                        class="inline-block text-zinc-600"
                                                                    />
                                                                </Tooltip>
                                                            </th>
                                                            <th
                                                                class="px-3 py-2 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider font-aspekta w-16"
                                                            >
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody
                                                        class="divide-y divide-zinc-200"
                                                    >
                                                        {#each responses as response, index (response.id)}
                                                            {@const rowId =
                                                                getRowId(
                                                                    response,
                                                                )}
                                                            {@const isExpanded =
                                                                isRowExpanded(
                                                                    rowId,
                                                                )}
                                                            {@const personEmail =
                                                                getPersonEmail(
                                                                    response,
                                                                )}
                                                            <tr
                                                                class="{index %
                                                                    2 ===
                                                                0
                                                                    ? 'bg-white'
                                                                    : 'bg-zinc-50'} hover:bg-zinc-100 transition-colors"
                                                            >
                                                                {#each tableColumns as column}
                                                                    {@const value =
                                                                        getResponseValue(
                                                                            response,
                                                                            column.id,
                                                                        )}
                                                                    <td
                                                                        class="px-3 py-2 whitespace-nowrap text-xs text-zinc-900 {column.isPII
                                                                            ? 'bg-orange-50/20'
                                                                            : ''}"
                                                                    >
                                                                        {@html formatTableValue(
                                                                            value,
                                                                        )}
                                                                    </td>
                                                                {/each}
                                                                <td
                                                                    class="px-3 py-2 whitespace-nowrap text-center"
                                                                >
                                                                    {#if personEmail}
                                                                        <Tooltip
                                                                            text="Opnieuw versturen"
                                                                            position="bottom"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onclick={() =>
                                                                                    handleResendClick(
                                                                                        personEmail,
                                                                                        getPersonName(
                                                                                            response,
                                                                                        ),
                                                                                    )}
                                                                                class="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-blue-100 transition-colors"
                                                                                aria-label="Opnieuw versturen"
                                                                                disabled={resendingResponse}
                                                                            >
                                                                                <SendHorizontal
                                                                                    size={14}
                                                                                    class="text-blue-600 hover:text-blue-700"
                                                                                />
                                                                            </button>
                                                                        </Tooltip>
                                                                    {/if}
                                                                </td>
                                                                <td
                                                                    class="px-3 py-2 whitespace-nowrap"
                                                                >
                                                                    <div
                                                                        class="flex items-center gap-1"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onclick={() =>
                                                                                toggleRow(
                                                                                    rowId,
                                                                                )}
                                                                            class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-zinc-100 transition-colors"
                                                                            aria-label={isExpanded
                                                                                ? "Inklappen"
                                                                                : "Uitklappen"}
                                                                            aria-expanded={isExpanded}
                                                                        >
                                                                            <ChevronDown
                                                                                size={14}
                                                                                class="text-zinc-500 transition-transform duration-200 {isExpanded
                                                                                    ? 'rotate-180'
                                                                                    : ''}"
                                                                            />
                                                                        </button>
                                                                        <Tooltip
                                                                            text="Bewerken"
                                                                            position="bottom"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onclick={() =>
                                                                                    handleEditClick(
                                                                                        response,
                                                                                    )}
                                                                                class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-blue-100 transition-colors"
                                                                                aria-label="Bewerken"
                                                                                disabled={savingResponse}
                                                                            >
                                                                                <SquarePen
                                                                                    size={14}
                                                                                    class="text-blue-600 hover:text-blue-700"
                                                                                />
                                                                            </button>
                                                                        </Tooltip>
                                                                        <Tooltip
                                                                            text="Verwijderen"
                                                                            position="bottom"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onclick={() =>
                                                                                    handleDeleteClick(
                                                                                        response.id,
                                                                                    )}
                                                                                class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-red-100 transition-colors"
                                                                                aria-label="Verwijderen"
                                                                                disabled={deletingResponse}
                                                                            >
                                                                                <Trash2
                                                                                    size={14}
                                                                                    class="text-red-600 hover:text-red-700"
                                                                                />
                                                                            </button>
                                                                        </Tooltip>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {#if isExpanded}
                                                                {@const tableColumns =
                                                                    getTableColumns()}
                                                                <tr
                                                                    class="bg-zinc-50/50"
                                                                >
                                                                    <td
                                                                        colspan={tableColumns.length +
                                                                            2}
                                                                        class="px-3 py-3"
                                                                    >
                                                                        <div
                                                                            class="space-y-2"
                                                                        >
                                                                            <!-- All Questions and Answers -->
                                                                            {#if response.data && Object.keys(response.data).length > 0}
                                                                                <div
                                                                                    class="grid grid-cols-1 gap-2"
                                                                                >
                                                                                    {#each getOrderedResponseEntries(response) as [questionId, value]}
                                                                                        {@const questionText =
                                                                                            getQuestionText(
                                                                                                questionId,
                                                                                            )}
                                                                                        <div
                                                                                            class="bg-white rounded border border-zinc-200 p-2"
                                                                                        >
                                                                                            <div
                                                                                                class="text-xs font-medium text-zinc-700 mb-1 flex items-center gap-2"
                                                                                            >
                                                                                                <span
                                                                                                    >{questionText}</span
                                                                                                >
                                                                                                <span
                                                                                                    class="text-zinc-400 font-normal font-pt-mono"
                                                                                                    >{questionId}</span
                                                                                                >
                                                                                            </div>
                                                                                            <div
                                                                                                class="text-xs text-zinc-900"
                                                                                            >
                                                                                                {#if typeof value === "object" && value !== null}
                                                                                                    <pre
                                                                                                        class="text-[10px] font-pt-mono">{JSON.stringify(
                                                                                                            value,
                                                                                                            null,
                                                                                                            2,
                                                                                                        )}</pre>
                                                                                                {:else if typeof value === "boolean"}
                                                                                                    {value
                                                                                                        ? "Ja"
                                                                                                        : "Nee"}
                                                                                                {:else}
                                                                                                    {String(
                                                                                                        value,
                                                                                                    )}
                                                                                                {/if}
                                                                                            </div>
                                                                                        </div>
                                                                                    {/each}
                                                                                </div>
                                                                            {:else}
                                                                                <div
                                                                                    class="text-xs text-zinc-500 italic"
                                                                                >
                                                                                    Geen
                                                                                    antwoorden
                                                                                    beschikbaar
                                                                                </div>
                                                                            {/if}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            {/if}
                                                        {/each}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/snippet}
                </Tabs>
            </div>
        {/if}
    {:else}
        <!-- List view -->
        <div class="mb-6">
            <h1 class="text-2xl font-semibold text-zinc-900 font-aspekta">
                Formbricks Integratie
            </h1>
            <p class="text-zinc-600 mt-1">
                Beheer en verstuur Formbricks formulieren naar medewerkers
            </p>
        </div>

        {#if loading}
            <div class="flex items-center justify-center py-12">
                <Loader2 class="h-8 w-8 text-zinc-400 animate-spin" />
            </div>
        {:else if error}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800">{error}</p>
            </div>
        {:else if surveys.length === 0}
            <div
                class="bg-white rounded-lg border border-zinc-200 p-6 shadow-xs"
            >
                <p class="text-zinc-600 text-center py-8">
                    Geen surveys gevonden
                </p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <a
                    href="https://formbricks-production-f895.up.railway.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="relative block text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
                >
                    <div class="flex items-center space-x-4">
                        <div
                            class="shrink-0 w-10 h-10 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors flex items-center justify-center"
                        >
                            <ExternalLink class="w-5 h-5 text-orange-600" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <div
                                class="text-sm font-medium text-zinc-900 truncate"
                            >
                                Formbricks Admin
                            </div>
                            <div
                                class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                            >
                                Open in nieuw tabblad
                            </div>
                        </div>
                    </div>
                </a>
                {#each surveys as survey (survey.id)}
                    <button
                        type="button"
                        onclick={() => selectSurvey(survey)}
                        class="relative block cursor-pointer text-left w-full group p-4 rounded-lg bg-white border border-zinc-200 hover:shadow-sm hover:border-zinc-300 transition-all"
                    >
                        <!-- Survey Icon & Name -->
                        <div class="flex items-center space-x-4">
                            <div
                                class="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors flex items-center justify-center"
                            >
                                <ListOrdered class="w-5 h-5 text-zinc-600" />
                            </div>
                            <div class="min-w-0 flex-1">
                                <div
                                    class="text-sm font-medium text-zinc-900 truncate"
                                >
                                    {survey.name}
                                </div>
                                <div
                                    class="text-xs text-zinc-500 group-hover:text-zinc-600 transition-colors"
                                >
                                    {#if survey.createdAt}
                                        Aangemaakt: {new Date(
                                            survey.createdAt,
                                        ).toLocaleDateString("nl-NL")}
                                    {:else}
                                        Survey
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    {/if}
</div>

<!-- Edit Response Drawer -->
<Drawer
    open={editDrawerOpen}
    position="right"
    class="w-[50vw]"
    onclose={closeEditDrawer}
>
    <div class="h-full flex flex-col">
        <div class="mb-6">
            <h2 class="text-xl font-semibold text-zinc-900 font-aspekta">
                Antwoord bewerken
            </h2>
            {#if selectedResponse}
                <p class="text-sm text-zinc-600 mt-1">
                    {getPersonName(selectedResponse)} • {getPersonEmail(
                        selectedResponse,
                    )}
                </p>
            {/if}
        </div>

        {#if savingResponse}
            <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                    <Loader2
                        class="h-8 w-8 text-zinc-400 animate-spin mx-auto mb-3"
                    />
                    <p class="text-sm text-zinc-600">Gegevens laden...</p>
                </div>
            </div>
        {:else if selectedResponse && selectedSurvey}
            <div class="flex-1 overflow-y-auto space-y-4">
                <!-- Edit form fields for each question in survey order -->
                {#if selectedSurvey.questions && Array.isArray(selectedSurvey.questions)}
                    {#each selectedSurvey.questions as question, qIndex}
                        {@const q = question as Record<string, unknown>}
                        {@const questionId = q.id as string}
                        {@const questionType = q.type as string}
                        {@const headlineRaw =
                            typeof q.headline === "object" &&
                            q.headline !== null &&
                            "default" in q.headline
                                ? ((q.headline as Record<string, unknown>)
                                      .default as string)
                                : typeof q.headline === "string"
                                  ? q.headline
                                  : questionId}
                        {@const subheaderRaw =
                            q.subheader &&
                            typeof q.subheader === "object" &&
                            "default" in q.subheader
                                ? ((q.subheader as Record<string, unknown>)
                                      .default as string)
                                : typeof q.subheader === "string"
                                  ? q.subheader
                                  : ""}
                        {@const headline = replaceRecallVariables(
                            headlineRaw,
                            editFormData,
                        )}
                        {@const subheader = replaceRecallVariables(
                            subheaderRaw,
                            editFormData,
                        )}
                        {@const required = q.required === true}
                        {@const currentValue = editFormData[questionId]}

                        <!-- Skip statement and CTA questions as they don't need user input -->
                        {#if questionId && questionType !== "statement" && currentValue !== undefined}
                            <div
                                class="bg-white rounded-lg border border-zinc-200 p-4"
                            >
                                <label
                                    for="edit-{questionId}"
                                    class="block text-sm font-medium text-zinc-900 mb-1"
                                >
                                    {headline}
                                    {#if required}
                                        <span class="text-red-500">*</span>
                                    {/if}
                                </label>
                                {#if subheader}
                                    <p class="text-xs text-zinc-500 mb-2">
                                        {subheader}
                                    </p>
                                {/if}

                                <!-- Open Text / Long Text -->
                                {#if questionType === "openText"}
                                    {@const inputType = q.inputType as string}
                                    {@const placeholderRaw =
                                        q.placeholder &&
                                        typeof q.placeholder === "object" &&
                                        "default" in q.placeholder
                                            ? ((
                                                  q.placeholder as Record<
                                                      string,
                                                      unknown
                                                  >
                                              ).default as string)
                                            : typeof q.placeholder === "string"
                                              ? q.placeholder
                                              : ""}
                                    {@const placeholder =
                                        replaceRecallVariables(
                                            placeholderRaw,
                                            editFormData,
                                        )}
                                    {#if inputType === "number"}
                                        <input
                                            id="edit-{questionId}"
                                            type="number"
                                            bind:value={
                                                editFormData[questionId]
                                            }
                                            {placeholder}
                                            class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    {:else if inputType === "email"}
                                        <input
                                            id="edit-{questionId}"
                                            type="email"
                                            bind:value={
                                                editFormData[questionId]
                                            }
                                            {placeholder}
                                            class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    {:else if inputType === "url"}
                                        <input
                                            id="edit-{questionId}"
                                            type="url"
                                            bind:value={
                                                editFormData[questionId]
                                            }
                                            {placeholder}
                                            class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    {:else if inputType === "phone"}
                                        <input
                                            id="edit-{questionId}"
                                            type="tel"
                                            bind:value={
                                                editFormData[questionId]
                                            }
                                            {placeholder}
                                            class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    {:else}
                                        <textarea
                                            id="edit-{questionId}"
                                            bind:value={
                                                editFormData[questionId]
                                            }
                                            rows="4"
                                            {placeholder}
                                            class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter"
                                        ></textarea>
                                    {/if}

                                    <!-- Multiple Choice Single -->
                                {:else if questionType === "multipleChoiceSingle"}
                                    {@const choices = Array.isArray(q.choices)
                                        ? (q.choices as Array<
                                              Record<string, unknown>
                                          >)
                                        : []}
                                    <div class="space-y-2">
                                        {#if !required && editFormData[questionId] === ""}
                                            <label
                                                class="flex items-center gap-2 p-2 rounded border border-blue-300 hover:bg-zinc-50 cursor-pointer bg-blue-50"
                                            >
                                                <input
                                                    type="radio"
                                                    name="edit-{questionId}"
                                                    value=""
                                                    checked={true}
                                                    onchange={() => {
                                                        editFormData[
                                                            questionId
                                                        ] = "";
                                                    }}
                                                    class="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-500"
                                                />
                                                <span
                                                    class="text-sm text-zinc-500 italic"
                                                    >Geen selectie</span
                                                >
                                            </label>
                                        {/if}
                                        {#each choices as choice}
                                            {@const choiceId =
                                                choice.id as string}
                                            {@const choiceLabel =
                                                choice.label &&
                                                typeof choice.label ===
                                                    "object" &&
                                                "default" in choice.label
                                                    ? ((
                                                          choice.label as Record<
                                                              string,
                                                              unknown
                                                          >
                                                      ).default as string)
                                                    : typeof choice.label ===
                                                        "string"
                                                      ? choice.label
                                                      : choiceId}
                                            {@const isSelected =
                                                editFormData[questionId] ===
                                                    choiceId ||
                                                editFormData[questionId] ===
                                                    choiceLabel}
                                            <label
                                                class="flex items-center gap-2 p-2 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer {isSelected
                                                    ? 'bg-blue-50 border-blue-300'
                                                    : ''}"
                                            >
                                                <input
                                                    type="radio"
                                                    name="edit-{questionId}"
                                                    value={choiceId}
                                                    checked={isSelected}
                                                    onchange={() => {
                                                        editFormData[
                                                            questionId
                                                        ] = choiceId;
                                                    }}
                                                    class="w-4 h-4 text-blue-600 border-zinc-300 focus:ring-blue-500"
                                                />
                                                <span
                                                    class="text-sm text-zinc-900"
                                                    >{choiceLabel}</span
                                                >
                                            </label>
                                        {/each}
                                    </div>

                                    <!-- Multiple Choice Multi -->
                                {:else if questionType === "multipleChoiceMulti"}
                                    {@const choices = Array.isArray(q.choices)
                                        ? (q.choices as Array<
                                              Record<string, unknown>
                                          >)
                                        : []}
                                    {@const selectedChoices = Array.isArray(
                                        editFormData[questionId],
                                    )
                                        ? (editFormData[questionId] as string[])
                                        : []}
                                    <div class="space-y-2">
                                        {#each choices as choice}
                                            {@const choiceId =
                                                choice.id as string}
                                            {@const choiceLabel =
                                                choice.label &&
                                                typeof choice.label ===
                                                    "object" &&
                                                "default" in choice.label
                                                    ? ((
                                                          choice.label as Record<
                                                              string,
                                                              unknown
                                                          >
                                                      ).default as string)
                                                    : typeof choice.label ===
                                                        "string"
                                                      ? choice.label
                                                      : choiceId}
                                            {@const isChecked =
                                                selectedChoices.includes(
                                                    choiceId,
                                                ) ||
                                                selectedChoices.includes(
                                                    choiceLabel,
                                                )}
                                            <label
                                                class="flex items-center gap-2 p-2 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer {isChecked
                                                    ? 'bg-blue-50 border-blue-300'
                                                    : ''}"
                                            >
                                                <input
                                                    type="checkbox"
                                                    value={choiceId}
                                                    checked={isChecked}
                                                    onchange={(e) => {
                                                        const checked = (
                                                            e.target as HTMLInputElement
                                                        ).checked;
                                                        const current =
                                                            Array.isArray(
                                                                editFormData[
                                                                    questionId
                                                                ],
                                                            )
                                                                ? (editFormData[
                                                                      questionId
                                                                  ] as string[])
                                                                : [];
                                                        if (checked) {
                                                            editFormData[
                                                                questionId
                                                            ] = [
                                                                ...current,
                                                                choiceId,
                                                            ];
                                                        } else {
                                                            // Remove both ID and label to handle legacy data
                                                            editFormData[
                                                                questionId
                                                            ] = current.filter(
                                                                (id: string) =>
                                                                    id !==
                                                                        choiceId &&
                                                                    id !==
                                                                        choiceLabel,
                                                            );
                                                        }
                                                    }}
                                                    class="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                                                />
                                                <span
                                                    class="text-sm text-zinc-900"
                                                    >{choiceLabel}</span
                                                >
                                            </label>
                                        {/each}
                                    </div>

                                    <!-- Rating -->
                                {:else if questionType === "rating"}
                                    {@const scale = (q.scale as string) || "5"}
                                    {@const range = parseInt(scale, 10)}
                                    {@const lowerLabel =
                                        q.lowerLabel &&
                                        typeof q.lowerLabel === "object" &&
                                        "default" in q.lowerLabel
                                            ? ((
                                                  q.lowerLabel as Record<
                                                      string,
                                                      unknown
                                                  >
                                              ).default as string)
                                            : ""}
                                    {@const upperLabel =
                                        q.upperLabel &&
                                        typeof q.upperLabel === "object" &&
                                        "default" in q.upperLabel
                                            ? ((
                                                  q.upperLabel as Record<
                                                      string,
                                                      unknown
                                                  >
                                              ).default as string)
                                            : ""}
                                    <div class="space-y-2">
                                        <div
                                            class="flex items-center justify-between gap-2"
                                        >
                                            {#if lowerLabel}
                                                <span
                                                    class="text-xs text-zinc-500"
                                                    >{lowerLabel}</span
                                                >
                                            {/if}
                                            <div class="flex gap-2">
                                                {#each Array(range) as _, i}
                                                    {@const value = i + 1}
                                                    <button
                                                        type="button"
                                                        onclick={() => {
                                                            editFormData[
                                                                questionId
                                                            ] = value;
                                                        }}
                                                        class="w-10 h-10 rounded-md border transition-colors {editFormData[
                                                            questionId
                                                        ] === value
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-zinc-900 border-zinc-300 hover:border-blue-500'}"
                                                    >
                                                        {value}
                                                    </button>
                                                {/each}
                                            </div>
                                            {#if upperLabel}
                                                <span
                                                    class="text-xs text-zinc-500"
                                                    >{upperLabel}</span
                                                >
                                            {/if}
                                        </div>
                                    </div>

                                    <!-- NPS -->
                                {:else if questionType === "nps"}
                                    <div class="space-y-2">
                                        <div class="flex flex-wrap gap-2">
                                            {#each Array(11) as _, i}
                                                <button
                                                    type="button"
                                                    onclick={() => {
                                                        editFormData[
                                                            questionId
                                                        ] = i;
                                                    }}
                                                    class="w-12 h-10 rounded-md border transition-colors {editFormData[
                                                        questionId
                                                    ] === i
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-zinc-900 border-zinc-300 hover:border-blue-500'}"
                                                >
                                                    {i}
                                                </button>
                                            {/each}
                                        </div>
                                        <div
                                            class="flex items-center justify-between text-xs text-zinc-500"
                                        >
                                            <span>Zeer onwaarschijnlijk</span>
                                            <span>Zeer waarschijnlijk</span>
                                        </div>
                                    </div>

                                    <!-- CTA (Call to Action) - Hidden, handled automatically -->
                                {:else if questionType === "cta"}
                                    <!-- CTA questions are skipped in the filter above -->

                                    <!-- Consent -->
                                {:else if questionType === "consent"}
                                    {@const isAccepted =
                                        editFormData[questionId] === true ||
                                        editFormData[questionId] === "accepted"}
                                    <label
                                        class="flex items-center gap-2 p-3 rounded border border-zinc-200 hover:bg-zinc-50 cursor-pointer {isAccepted
                                            ? 'bg-blue-50 border-blue-300'
                                            : ''}"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isAccepted}
                                            onchange={(e) => {
                                                editFormData[questionId] = (
                                                    e.target as HTMLInputElement
                                                ).checked
                                                    ? "accepted"
                                                    : "dismissed";
                                            }}
                                            class="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500"
                                        />
                                        <span class="text-sm text-zinc-900"
                                            >Akkoord</span
                                        >
                                    </label>

                                    <!-- Date -->
                                {:else if questionType === "date"}
                                    <input
                                        id="edit-{questionId}"
                                        type="date"
                                        bind:value={editFormData[questionId]}
                                        class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />

                                    <!-- Picture Selection -->
                                {:else if questionType === "pictureSelection"}
                                    {@const choices = Array.isArray(q.choices)
                                        ? (q.choices as Array<
                                              Record<string, unknown>
                                          >)
                                        : []}
                                    <div class="grid grid-cols-2 gap-2">
                                        {#each choices as choice}
                                            {@const choiceId =
                                                choice.id as string}
                                            {@const imageUrl =
                                                choice.imageUrl as string}
                                            <button
                                                type="button"
                                                onclick={() => {
                                                    editFormData[questionId] =
                                                        choiceId;
                                                }}
                                                class="relative rounded-lg overflow-hidden border-2 transition-all {editFormData[
                                                    questionId
                                                ] === choiceId
                                                    ? 'border-blue-600 ring-2 ring-blue-600'
                                                    : 'border-zinc-200 hover:border-blue-400'}"
                                            >
                                                {#if imageUrl}
                                                    <img
                                                        src={imageUrl}
                                                        alt={choiceId}
                                                        class="w-full h-32 object-cover"
                                                    />
                                                {:else}
                                                    <div
                                                        class="w-full h-32 bg-zinc-100 flex items-center justify-center text-zinc-400"
                                                    >
                                                        Geen afbeelding
                                                    </div>
                                                {/if}
                                            </button>
                                        {/each}
                                    </div>

                                    <!-- Fallback for other types -->
                                {:else if typeof currentValue === "boolean"}
                                    <select
                                        id="edit-{questionId}"
                                        bind:value={editFormData[questionId]}
                                        class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={true}>Ja</option>
                                        <option value={false}>Nee</option>
                                    </select>
                                {:else if typeof currentValue === "number"}
                                    <input
                                        id="edit-{questionId}"
                                        type="number"
                                        bind:value={editFormData[questionId]}
                                        class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                {:else if typeof currentValue === "string" && currentValue.length > 50}
                                    <textarea
                                        id="edit-{questionId}"
                                        bind:value={editFormData[questionId]}
                                        rows="4"
                                        class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter"
                                    ></textarea>
                                {:else if Array.isArray(currentValue)}
                                    <div
                                        class="p-3 bg-zinc-50 border border-zinc-200 rounded-md"
                                    >
                                        <p class="text-xs text-zinc-600 mb-2">
                                            Array waarde (geavanceerd)
                                        </p>
                                        <pre
                                            class="text-xs font-pt-mono overflow-x-auto">{JSON.stringify(
                                                currentValue,
                                                null,
                                                2,
                                            )}</pre>
                                    </div>
                                {:else}
                                    <input
                                        id="edit-{questionId}"
                                        type="text"
                                        bind:value={editFormData[questionId]}
                                        class="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                {/if}
                            </div>
                        {/if}
                    {/each}
                {/if}
            </div>

            <!-- Action buttons -->
            <div
                class="mt-6 pt-4 border-t border-zinc-200 flex gap-3 justify-end"
            >
                <Button
                    variant="secondary"
                    onclick={closeEditDrawer}
                    disabled={savingResponse}
                >
                    Annuleren
                </Button>
                <Button onclick={saveResponseChanges} disabled={savingResponse}>
                    {savingResponse ? "Opslaan..." : "Opslaan"}
                </Button>
            </div>
        {/if}
    </div>
</Drawer>

<!-- Delete Confirmation Modal -->
<Modal
    bind:open={deleteModalOpen}
    title="Antwoord verwijderen"
    size="md"
    closeOnBackdropClick={false}
    loading={deletingResponse}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u dit antwoord wilt verwijderen?
        </p>
        <p class="text-sm text-zinc-500">
            Deze actie kan niet ongedaan worden gemaakt.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelDelete}
                disabled={deletingResponse}
            >
                Annuleren
            </Button>
            <button
                onclick={confirmDelete}
                disabled={deletingResponse}
                class="px-4 py-2 bg-red-600 text-white rounded-sm shadow-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-aspekta"
            >
                {deletingResponse ? "Verwijderen..." : "Verwijderen"}
            </button>
        </div>
    </div>
</Modal>

<!-- Resend Confirmation Modal -->
<Modal
    bind:open={resendModalOpen}
    title="Formulier opnieuw versturen"
    size="md"
    closeOnBackdropClick={false}
    loading={resendingResponse}
>
    <div class="space-y-4">
        <p class="text-zinc-600">
            Weet u zeker dat u het formulier opnieuw wilt versturen naar <strong
                class="text-zinc-900">{selectedResponseEmail}</strong
            >?
        </p>
        <p class="text-sm text-zinc-500">
            Er wordt een nieuwe e-mail verzonden naar het opgegeven adres.
        </p>
        <div class="pt-4 border-t border-zinc-200 flex gap-3 justify-end">
            <Button
                variant="secondary"
                onclick={cancelResend}
                disabled={resendingResponse}
            >
                Annuleren
            </Button>
            <Button onclick={confirmResend} disabled={resendingResponse}>
                {resendingResponse ? "Versturen..." : "Versturen"}
            </Button>
        </div>
    </div>
</Modal>
