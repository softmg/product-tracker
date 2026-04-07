<?php

use App\Http\Controllers\Api\V1\Admin\CommitteeMemberController;
use App\Http\Controllers\Api\V1\Admin\DeepDiveConfigController;
use App\Http\Controllers\Api\V1\Admin\NotificationConfigController;
use App\Http\Controllers\Api\V1\Admin\ScoringConfigController;
use App\Http\Controllers\Api\V1\Admin\ScoringThresholdController;
use App\Http\Controllers\Api\V1\Admin\SlaConfigController;
use App\Http\Controllers\Api\V1\Admin\StatusTransitionController;
use App\Http\Controllers\Api\V1\Admin\TeamController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\CommitteeController;
use App\Http\Controllers\Api\V1\DeepDiveController;
use App\Http\Controllers\Api\V1\ExperimentController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\FileController;
use App\Http\Controllers\Api\V1\HypothesisController;
use App\Http\Controllers\Api\V1\HypothesisStatusController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\RespondentController;
use App\Http\Controllers\Api\V1\ScoringController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ]));

    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('hypotheses', HypothesisController::class);
        Route::get('hypotheses/{hypothesis}/transitions', [HypothesisStatusController::class, 'transitions']);
        Route::post('hypotheses/{hypothesis}/transition', [HypothesisStatusController::class, 'transition']);
        Route::get('hypotheses/{hypothesis}/scoring/{stage}', [ScoringController::class, 'show']);
        Route::post('hypotheses/{hypothesis}/scoring/{stage}', [ScoringController::class, 'submit']);
        Route::get('scoring-criteria', [ScoringController::class, 'criteria']);

        Route::get('hypotheses/{hypothesis}/deep-dive', [DeepDiveController::class, 'index']);
        Route::put('hypotheses/{hypothesis}/deep-dive/{stage}', [DeepDiveController::class, 'update']);
        Route::post('hypotheses/{hypothesis}/deep-dive/{stage}/comments', [DeepDiveController::class, 'addComment']);
        Route::get('hypotheses/{hypothesis}/deep-dive/progress', [DeepDiveController::class, 'progress']);

        Route::get('hypotheses/{hypothesis}/respondents', [RespondentController::class, 'index']);
        Route::post('hypotheses/{hypothesis}/respondents', [RespondentController::class, 'store']);
        Route::put('hypotheses/{hypothesis}/respondents/{respondent}', [RespondentController::class, 'update']);
        Route::delete('hypotheses/{hypothesis}/respondents/{respondent}', [RespondentController::class, 'destroy']);
        Route::post('respondents/{respondent}/pains', [RespondentController::class, 'addPain']);
        Route::delete('respondents/{respondent}/pains/{pain}', [RespondentController::class, 'removePain']);
        Route::get('hypotheses/{hypothesis}/pain-summary', [RespondentController::class, 'painSummary']);

        Route::get('hypotheses/{hypothesis}/experiments', [ExperimentController::class, 'index']);
        Route::post('hypotheses/{hypothesis}/experiments', [ExperimentController::class, 'store']);
        Route::put('hypotheses/{hypothesis}/experiments/{experiment}', [ExperimentController::class, 'update']);
        Route::delete('hypotheses/{hypothesis}/experiments/{experiment}', [ExperimentController::class, 'destroy']);
        Route::patch('experiments/{experiment}/result', [ExperimentController::class, 'updateResult']);

        Route::get('hypotheses/{hypothesis}/votes', [CommitteeController::class, 'index']);
        Route::post('hypotheses/{hypothesis}/votes', [CommitteeController::class, 'castVote']);
        Route::post('hypotheses/{hypothesis}/finalize-decision', [CommitteeController::class, 'finalizeDecision']);

        Route::get('audit-log', [AuditLogController::class, 'index'])->middleware('admin');
        Route::get('hypotheses/{hypothesis}/history', [AuditLogController::class, 'hypothesisHistory']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);

        Route::get('hypotheses/{hypothesis}/files', [FileController::class, 'index']);
        Route::post('hypotheses/{hypothesis}/files', [FileController::class, 'store']);
        Route::get('files/{file}/download', [FileController::class, 'download']);
        Route::delete('files/{file}', [FileController::class, 'destroy']);

        Route::get('hypotheses/{hypothesis}/export/pdf', [ExportController::class, 'pdf']);
        Route::get('hypotheses/{hypothesis}/export/excel', [ExportController::class, 'excel']);

        Route::get('analytics/status-distribution', [AnalyticsController::class, 'statusDistribution']);
        Route::get('analytics/initiator-stats', [AnalyticsController::class, 'initiatorStats']);
        Route::get('analytics/team-stats', [AnalyticsController::class, 'teamStats']);
        Route::get('analytics/timeline', [AnalyticsController::class, 'timeline']);
        Route::get('analytics/export', [AnalyticsController::class, 'export']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::post('users', [UserController::class, 'store']);
            Route::get('users/{user}', [UserController::class, 'show']);
            Route::put('users/{user}', [UserController::class, 'update']);
            Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);

            Route::get('teams', [TeamController::class, 'index']);
            Route::post('teams', [TeamController::class, 'store']);
            Route::put('teams/{team}', [TeamController::class, 'update']);
            Route::delete('teams/{team}', [TeamController::class, 'destroy']);

            Route::get('committee-members', [CommitteeMemberController::class, 'index']);
            Route::post('committee-members', [CommitteeMemberController::class, 'store']);
            Route::put('committee-members/{committeeMember}', [CommitteeMemberController::class, 'update']);
            Route::delete('committee-members/{committeeMember}', [CommitteeMemberController::class, 'destroy']);

            Route::get('status-transitions', [StatusTransitionController::class, 'index']);
            Route::post('status-transitions', [StatusTransitionController::class, 'store']);
            Route::put('status-transitions/{statusTransition}', [StatusTransitionController::class, 'update']);
            Route::delete('status-transitions/{statusTransition}', [StatusTransitionController::class, 'destroy']);

            Route::get('scoring-criteria', [ScoringConfigController::class, 'index']);
            Route::post('scoring-criteria', [ScoringConfigController::class, 'store']);
            Route::put('scoring-criteria/{scoringCriterion}', [ScoringConfigController::class, 'update']);
            Route::delete('scoring-criteria/{scoringCriterion}', [ScoringConfigController::class, 'destroy']);

            Route::get('scoring-thresholds', [ScoringThresholdController::class, 'show']);
            Route::put('scoring-thresholds', [ScoringThresholdController::class, 'update']);

            Route::get('sla-configs', [SlaConfigController::class, 'index']);
            Route::post('sla-configs', [SlaConfigController::class, 'store']);
            Route::put('sla-configs/{slaConfig}', [SlaConfigController::class, 'update']);
            Route::delete('sla-configs/{slaConfig}', [SlaConfigController::class, 'destroy']);

            Route::get('notification-events', [NotificationConfigController::class, 'index']);
            Route::post('notification-events', [NotificationConfigController::class, 'store']);
            Route::put('notification-events/{notificationEvent}', [NotificationConfigController::class, 'update']);
            Route::delete('notification-events/{notificationEvent}', [NotificationConfigController::class, 'destroy']);

            Route::get('deep-dive-stages', [DeepDiveConfigController::class, 'index']);
            Route::post('deep-dive-stages', [DeepDiveConfigController::class, 'store']);
            Route::put('deep-dive-stages/{deepDiveStage}', [DeepDiveConfigController::class, 'update']);
            Route::delete('deep-dive-stages/{deepDiveStage}', [DeepDiveConfigController::class, 'destroy']);
        });
    });
});
