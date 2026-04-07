<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Initiator = 'initiator';
    case PdManager = 'pd_manager';
    case Analyst = 'analyst';
    case TechLead = 'tech_lead';
    case BizDev = 'bizdev';
    case Committee = 'committee';
}
