<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hypothesis Passport</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        h1, h2 { margin: 0 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        .section { margin-bottom: 16px; }
    </style>
</head>
<body>
<h1>Hypothesis Passport</h1>

<div class="section">
    <h2>General</h2>
    <table>
        <tr><th>ID</th><td>{{ $hypothesis->id }}</td></tr>
        <tr><th>Code</th><td>{{ $hypothesis->code }}</td></tr>
        <tr><th>Title</th><td>{{ $hypothesis->title }}</td></tr>
        <tr><th>Status</th><td>{{ $hypothesis->status->value }}</td></tr>
        <tr><th>Priority</th><td>{{ $hypothesis->priority?->value }}</td></tr>
        <tr><th>Initiator</th><td>{{ $hypothesis->initiator?->name }}</td></tr>
        <tr><th>Owner</th><td>{{ $hypothesis->owner?->name }}</td></tr>
        <tr><th>Team</th><td>{{ $hypothesis->team?->name }}</td></tr>
        <tr><th>Primary score</th><td>{{ $hypothesis->scoring_primary }}</td></tr>
        <tr><th>Deep score</th><td>{{ $hypothesis->scoring_deep }}</td></tr>
    </table>
</div>

<div class="section">
    <h2>Scoring</h2>
    <table>
        <tr><th>Stage</th><th>Total</th><th>Stop factor</th></tr>
        @foreach($hypothesis->scorings as $scoring)
            <tr>
                <td>{{ $scoring->stage }}</td>
                <td>{{ $scoring->total_score }}</td>
                <td>{{ $scoring->stop_factor_triggered ? 'yes' : 'no' }}</td>
            </tr>
        @endforeach
    </table>
</div>

<div class="section">
    <h2>Deep Dive</h2>
    <table>
        <tr><th>Stage</th><th>Completed</th><th>Completed at</th></tr>
        @foreach($hypothesis->deepDives as $deepDive)
            <tr>
                <td>{{ $deepDive->stage?->name }}</td>
                <td>{{ $deepDive->is_completed ? 'yes' : 'no' }}</td>
                <td>{{ $deepDive->completed_at }}</td>
            </tr>
        @endforeach
    </table>
</div>

<div class="section">
    <h2>Experiments</h2>
    <table>
        <tr><th>Title</th><th>Status</th><th>Result</th></tr>
        @foreach($hypothesis->experiments as $experiment)
            <tr>
                <td>{{ $experiment->title }}</td>
                <td>{{ $experiment->status }}</td>
                <td>{{ $experiment->result }}</td>
            </tr>
        @endforeach
    </table>
</div>

<div class="section">
    <h2>Respondents</h2>
    <table>
        <tr><th>Name</th><th>Status</th><th>Company</th></tr>
        @foreach($hypothesis->respondents as $respondent)
            <tr>
                <td>{{ $respondent->name }}</td>
                <td>{{ $respondent->status }}</td>
                <td>{{ $respondent->company }}</td>
            </tr>
        @endforeach
    </table>
</div>
</body>
</html>
