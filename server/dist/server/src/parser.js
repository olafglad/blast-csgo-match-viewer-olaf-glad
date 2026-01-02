import { readFileSync } from 'fs';
const PATTERNS = {
    timestamp: /^(\d{2}\/\d{2}\/\d{4}) - (\d{2}:\d{2}:\d{2}):/,
    matchStart: /World triggered "Match_Start" on "(.+?)"/,
    roundStart: /World triggered "Round_Start"/,
    roundEnd: /World triggered "Round_End"/,
    gameOver: /Game Over: competitive \d+ (\w+) score (\d+):(\d+) after (\d+) min/,
    teamPlaying: /Team playing "(CT|TERRORIST)": (.+)/,
    roundWin: /Team "(CT|TERRORIST)" triggered "(SFUI_Notice_\w+)"/,
    kill: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*\[\-?\d+ \-?\d+ \-?\d+\] killed "(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*with "(\w+)"( \(headshot\))?/,
    damage: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*attacked "(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*\(damage "(\d+)"\)/,
    damageWithHitgroup: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*attacked "(.+?)<\d+><[^>]+><(CT|TERRORIST)>".*\(damage "(\d+)"\).*\(hitgroup "([^"]+)"\)/,
    assist: /"(.+?)<\d+><[^>]+><(?:CT|TERRORIST)>" assisted killing "(.+?)<\d+>/,
    flashThrow: /"(.+?)<\d+><[^>]+><(CT|TERRORIST|Spectator)>" threw flashbang \[.*\] flashbang entindex (\d+)\)/,
    blind: /"(.+?)<\d+><[^>]+><(CT|TERRORIST|Spectator)>" blinded for ([\d.]+) by "(.+?)<\d+><[^>]+><(CT|TERRORIST|Spectator)>" from flashbang entindex (\d+)/,
    chat: /"(.+?)<\d+><[^>]+><(CT|TERRORIST)>" (say|say_team) "(.*)"/,
};
function parseWinReason(sfuiNotice) {
    if (sfuiNotice.includes('Bomb_Defused'))
        return 'bomb_defused';
    if (sfuiNotice.includes('Target_Bombed'))
        return 'bomb_exploded';
    if (sfuiNotice.includes('CTs_Win') || sfuiNotice.includes('Terrorists_Win'))
        return 'elimination';
    return 'timeout';
}
function parseTimestamp(dateStr, timeStr) {
    const [month, day, year] = dateStr.split('/').map(Number);
    const [hour, min, sec] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hour, min, sec);
}
function parseSide(side) {
    return side === 'CT' ? 'CT' : 'T';
}
export function parseLogFile(filePath) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let map = '';
    let matchDate = '';
    let ctTeam = '';
    let tTeam = '';
    let matchStarted = false;
    let lastMatchStartLine = 0;
    for (let i = 0; i < lines.length; i++) {
        if (PATTERNS.matchStart.test(lines[i])) {
            lastMatchStartLine = i;
        }
    }
    const rounds = [];
    let currentRound = null;
    let roundNumber = 0;
    let ctScore = 0;
    let tScore = 0;
    let freezeTimeChat = [];
    for (let i = lastMatchStartLine; i < lines.length; i++) {
        const line = lines[i];
        const tsMatch = line.match(PATTERNS.timestamp);
        if (!tsMatch)
            continue;
        const timestamp = parseTimestamp(tsMatch[1], tsMatch[2]);
        if (!matchDate)
            matchDate = tsMatch[1];
        const matchStartMatch = line.match(PATTERNS.matchStart);
        if (matchStartMatch) {
            map = matchStartMatch[1];
            matchStarted = true;
            continue;
        }
        const teamMatch = line.match(PATTERNS.teamPlaying);
        if (teamMatch && matchStarted && !line.includes('MatchStatus')) {
            if (teamMatch[1] === 'CT' && !ctTeam)
                ctTeam = teamMatch[2];
            else if (teamMatch[1] !== 'CT' && !tTeam)
                tTeam = teamMatch[2];
            continue;
        }
        if (PATTERNS.roundStart.test(line) && matchStarted && ctTeam && tTeam) {
            roundNumber++;
            currentRound = {
                number: roundNumber,
                startTime: timestamp,
                endTime: timestamp,
                winner: 'CT',
                winReason: 'elimination',
                kills: [],
                damage: [],
                assists: [],
                flashes: [],
                blinds: [],
                chat: [...freezeTimeChat],
                ctTeam,
                tTeam,
            };
            freezeTimeChat = [];
            continue;
        }
        const chatMatch = line.match(PATTERNS.chat);
        if (chatMatch && matchStarted && ctTeam && tTeam) {
            const side = chatMatch[2] === 'CT' ? 'CT' : 'T';
            const chatMsg = {
                timestamp,
                player: chatMatch[1],
                playerSide: side,
                message: chatMatch[4],
                isTeamChat: chatMatch[3] === 'say_team',
                isFreezeTime: !currentRound,
            };
            if (currentRound) {
                currentRound.chat.push(chatMsg);
            }
            else {
                freezeTimeChat.push(chatMsg);
            }
            continue;
        }
        if (!currentRound)
            continue;
        const killMatch = line.match(PATTERNS.kill);
        if (killMatch) {
            if (killMatch[3].includes('func_') || killMatch[3].includes('prop_'))
                continue;
            currentRound.kills.push({
                timestamp,
                killer: killMatch[1],
                killerSide: parseSide(killMatch[2]),
                victim: killMatch[3],
                victimSide: parseSide(killMatch[4]),
                weapon: killMatch[5],
                headshot: !!killMatch[6],
            });
            continue;
        }
        const damageWithHitgroupMatch = line.match(PATTERNS.damageWithHitgroup);
        if (damageWithHitgroupMatch) {
            currentRound.damage.push({
                timestamp,
                attacker: damageWithHitgroupMatch[1],
                attackerSide: parseSide(damageWithHitgroupMatch[2]),
                victim: damageWithHitgroupMatch[3],
                victimSide: parseSide(damageWithHitgroupMatch[4]),
                damage: parseInt(damageWithHitgroupMatch[5], 10),
                hitgroup: damageWithHitgroupMatch[6],
            });
            continue;
        }
        const damageMatch = line.match(PATTERNS.damage);
        if (damageMatch) {
            currentRound.damage.push({
                timestamp,
                attacker: damageMatch[1],
                attackerSide: parseSide(damageMatch[2]),
                victim: damageMatch[3],
                victimSide: parseSide(damageMatch[4]),
                damage: parseInt(damageMatch[5], 10),
                hitgroup: '',
            });
            continue;
        }
        const assistMatch = line.match(PATTERNS.assist);
        if (assistMatch) {
            currentRound.assists.push({
                timestamp,
                assister: assistMatch[1],
                victim: assistMatch[2],
            });
            continue;
        }
        const flashMatch = line.match(PATTERNS.flashThrow);
        if (flashMatch) {
            const side = flashMatch[2] === 'CT' ? 'CT' : flashMatch[2] === 'TERRORIST' ? 'T' : 'Spectator';
            currentRound.flashes.push({
                timestamp,
                thrower: flashMatch[1],
                throwerSide: side,
                entindex: parseInt(flashMatch[3], 10),
            });
            continue;
        }
        const blindMatch = line.match(PATTERNS.blind);
        if (blindMatch) {
            const victimSide = blindMatch[2] === 'CT' ? 'CT' : blindMatch[2] === 'TERRORIST' ? 'T' : 'Spectator';
            const throwerSide = blindMatch[5] === 'CT' ? 'CT' : blindMatch[5] === 'TERRORIST' ? 'T' : 'Spectator';
            currentRound.blinds.push({
                timestamp,
                victim: blindMatch[1],
                victimSide: victimSide,
                thrower: blindMatch[4],
                throwerSide: throwerSide,
                duration: parseFloat(blindMatch[3]),
                entindex: parseInt(blindMatch[6], 10),
            });
            continue;
        }
        const winMatch = line.match(PATTERNS.roundWin);
        if (winMatch && currentRound) {
            currentRound.winner = parseSide(winMatch[1]);
            currentRound.winReason = parseWinReason(winMatch[2]);
            if (currentRound.winner === 'CT')
                ctScore++;
            else
                tScore++;
            continue;
        }
        if (PATTERNS.roundEnd.test(line) && currentRound) {
            currentRound.endTime = timestamp;
            rounds.push(currentRound);
            currentRound = null;
            continue;
        }
        const gameOverMatch = line.match(PATTERNS.gameOver);
        if (gameOverMatch) {
            break;
        }
    }
    return transformToMatchData(rounds, map, matchDate, ctTeam, tTeam);
}
function transformToMatchData(rounds, map, date, startingCT, startingT) {
    const firstRound = rounds[0];
    const lastRound = rounds[rounds.length - 1];
    const durationMs = lastRound?.endTime.getTime() - firstRound?.startTime.getTime() || 0;
    const durationMins = Math.floor(durationMs / 60000);
    const durationSecs = Math.floor((durationMs % 60000) / 1000);
    const playerStatsMap = new Map();
    const killsPerRoundPerPlayer = new Map();
    const initPlayerStats = (_name, team) => ({
        team,
        kills: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        headshots: 0,
        firstHalfKills: 0,
        firstHalfDeaths: 0,
        firstHalfDamage: 0,
        firstHalfHeadshots: 0,
        secondHalfKills: 0,
        secondHalfDeaths: 0,
        secondHalfDamage: 0,
        secondHalfHeadshots: 0,
        ctKills: 0,
        ctDeaths: 0,
        ctDamage: 0,
        ctHeadshots: 0,
        tKills: 0,
        tDeaths: 0,
        tDamage: 0,
        tHeadshots: 0,
        openingKills: 0,
        openingDeaths: 0,
        clutchesWon: 0,
        clutchesAttempted: 0,
        leftLegDamage: 0,
        rightLegDamage: 0,
        totalDamageDealt: 0,
        flashStats: {
            thrown: 0,
            enemiesBlinded: 0,
            enemyBlindTime: 0,
            teammatesBlinded: 0,
            teammateBlindTime: 0,
            selfFlashes: 0,
            selfBlindTime: 0,
            spectatorsFlashed: 0,
            spectatorBlinds: [],
        },
        multiKillRounds: {
            twoK: 0,
            threeK: 0,
            fourK: 0,
            ace: 0,
        },
    });
    const teamStats = {
        [startingCT]: {
            name: startingCT,
            finalScore: 0,
            firstHalfScore: 0,
            secondHalfScore: 0,
            roundWinTypes: { elimination: 0, bombDefused: 0, bombExploded: 0, timeout: 0 },
            ctRoundsWon: 0,
            tRoundsWon: 0,
        },
        [startingT]: {
            name: startingT,
            finalScore: 0,
            firstHalfScore: 0,
            secondHalfScore: 0,
            roundWinTypes: { elimination: 0, bombDefused: 0, bombExploded: 0, timeout: 0 },
            ctRoundsWon: 0,
            tRoundsWon: 0,
        },
    };
    const roundData = rounds.map((round, idx) => {
        const isFirstHalf = round.number <= 15;
        const roundNum = round.number;
        const currentCT = isFirstHalf ? startingCT : startingT;
        const currentT = isFirstHalf ? startingT : startingCT;
        const getSide = (team) => team === currentCT ? 'CT' : 'T';
        const winnerTeam = round.winner === 'CT' ? currentCT : currentT;
        teamStats[winnerTeam].finalScore++;
        if (isFirstHalf)
            teamStats[winnerTeam].firstHalfScore++;
        else
            teamStats[winnerTeam].secondHalfScore++;
        if (round.winner === 'CT')
            teamStats[winnerTeam].ctRoundsWon++;
        else
            teamStats[winnerTeam].tRoundsWon++;
        const winType = round.winReason;
        if (winType === 'elimination')
            teamStats[winnerTeam].roundWinTypes.elimination++;
        else if (winType === 'bomb_defused')
            teamStats[winnerTeam].roundWinTypes.bombDefused++;
        else if (winType === 'bomb_exploded')
            teamStats[winnerTeam].roundWinTypes.bombExploded++;
        else
            teamStats[winnerTeam].roundWinTypes.timeout++;
        const roundDamage = new Map();
        for (const dmg of round.damage) {
            if (dmg.attackerSide !== dmg.victimSide) {
                roundDamage.set(dmg.attacker, (roundDamage.get(dmg.attacker) || 0) + dmg.damage);
                const attackerTeam = dmg.attackerSide === 'CT' ? currentCT : currentT;
                if (!playerStatsMap.has(dmg.attacker)) {
                    playerStatsMap.set(dmg.attacker, initPlayerStats(dmg.attacker, attackerTeam));
                }
                const attackerStats = playerStatsMap.get(dmg.attacker);
                attackerStats.totalDamageDealt += dmg.damage;
                if (dmg.hitgroup === 'left leg') {
                    attackerStats.leftLegDamage += dmg.damage;
                }
                else if (dmg.hitgroup === 'right leg') {
                    attackerStats.rightLegDamage += dmg.damage;
                }
            }
        }
        const roundKills = new Map();
        const roundDeaths = new Set();
        const roundHeadshots = new Map();
        let openingKillProcessed = false;
        const killEvents = [];
        for (const kill of round.kills) {
            const killerTeam = kill.killerSide === 'CT' ? currentCT : currentT;
            const victimTeam = kill.victimSide === 'CT' ? currentCT : currentT;
            if (kill.killerSide !== kill.victimSide) {
                roundKills.set(kill.killer, (roundKills.get(kill.killer) || 0) + 1);
                if (kill.headshot) {
                    roundHeadshots.set(kill.killer, (roundHeadshots.get(kill.killer) || 0) + 1);
                }
                if (!openingKillProcessed) {
                    openingKillProcessed = true;
                    if (!playerStatsMap.has(kill.killer)) {
                        playerStatsMap.set(kill.killer, initPlayerStats(kill.killer, killerTeam));
                    }
                    if (!playerStatsMap.has(kill.victim)) {
                        playerStatsMap.set(kill.victim, initPlayerStats(kill.victim, victimTeam));
                    }
                    playerStatsMap.get(kill.killer).openingKills++;
                    playerStatsMap.get(kill.victim).openingDeaths++;
                }
            }
            roundDeaths.add(kill.victim);
            if (!playerStatsMap.has(kill.killer)) {
                playerStatsMap.set(kill.killer, initPlayerStats(kill.killer, killerTeam));
            }
            if (!playerStatsMap.has(kill.victim)) {
                playerStatsMap.set(kill.victim, initPlayerStats(kill.victim, victimTeam));
            }
            const killerStats = playerStatsMap.get(kill.killer);
            const victimStats = playerStatsMap.get(kill.victim);
            if (kill.killerSide !== kill.victimSide) {
                killerStats.kills++;
                if (kill.headshot) {
                    killerStats.headshots++;
                    if (isFirstHalf)
                        killerStats.firstHalfHeadshots++;
                    else
                        killerStats.secondHalfHeadshots++;
                    if (kill.killerSide === 'CT')
                        killerStats.ctHeadshots++;
                    else
                        killerStats.tHeadshots++;
                }
                if (isFirstHalf)
                    killerStats.firstHalfKills++;
                else
                    killerStats.secondHalfKills++;
                if (kill.killerSide === 'CT')
                    killerStats.ctKills++;
                else
                    killerStats.tKills++;
            }
            victimStats.deaths++;
            if (isFirstHalf)
                victimStats.firstHalfDeaths++;
            else
                victimStats.secondHalfDeaths++;
            if (kill.victimSide === 'CT')
                victimStats.ctDeaths++;
            else
                victimStats.tDeaths++;
            killEvents.push({
                timestamp: kill.timestamp.toISOString(),
                killer: kill.killer,
                killerTeam,
                victim: kill.victim,
                victimTeam,
                weapon: kill.weapon,
                headshot: kill.headshot,
            });
        }
        for (const assist of round.assists) {
            const stats = playerStatsMap.get(assist.assister);
            if (stats)
                stats.assists++;
        }
        for (const [player, damage] of roundDamage) {
            const stats = playerStatsMap.get(player);
            if (!stats)
                continue;
            stats.damage += damage;
            if (isFirstHalf)
                stats.firstHalfDamage += damage;
            else
                stats.secondHalfDamage += damage;
            const playerSide = getSide(stats.team);
            if (playerSide === 'CT')
                stats.ctDamage += damage;
            else
                stats.tDamage += damage;
        }
        const enemyKills = round.kills.filter(k => k.killerSide !== k.victimSide);
        if (enemyKills.length > 0) {
            const ctPlayers = new Set();
            const tPlayers = new Set();
            for (const kill of round.kills) {
                if (kill.killerSide === 'CT')
                    ctPlayers.add(kill.killer);
                else
                    tPlayers.add(kill.killer);
                if (kill.victimSide === 'CT')
                    ctPlayers.add(kill.victim);
                else
                    tPlayers.add(kill.victim);
            }
            const ctAlive = new Set(ctPlayers);
            const tAlive = new Set(tPlayers);
            for (const kill of enemyKills) {
                if (kill.victimSide === 'CT')
                    ctAlive.delete(kill.victim);
                else
                    tAlive.delete(kill.victim);
                const killerSide = kill.killerSide;
                const aliveSet = killerSide === 'CT' ? ctAlive : tAlive;
                const enemyAlive = killerSide === 'CT' ? tAlive : ctAlive;
                if (aliveSet.size === 1 && enemyAlive.size > 0) {
                    break;
                }
            }
        }
        const ctParticipants = new Set();
        const tParticipants = new Set();
        for (const kill of round.kills) {
            if (kill.killerSide === 'CT')
                ctParticipants.add(kill.killer);
            else
                tParticipants.add(kill.killer);
            if (kill.victimSide === 'CT')
                ctParticipants.add(kill.victim);
            else
                tParticipants.add(kill.victim);
        }
        let ctLiving = new Set(ctParticipants);
        let tLiving = new Set(tParticipants);
        let clutchPlayer = null;
        let clutchEnemiesLeft = 0;
        for (let i = 0; i < enemyKills.length; i++) {
            const kill = enemyKills[i];
            if (kill.victimSide === 'CT')
                ctLiving.delete(kill.victim);
            else
                tLiving.delete(kill.victim);
            const killerTeamAlive = kill.killerSide === 'CT' ? ctLiving : tLiving;
            const enemyTeamAlive = kill.killerSide === 'CT' ? tLiving : ctLiving;
            if (killerTeamAlive.size === 1 && enemyTeamAlive.size > 0 && !clutchPlayer) {
                clutchPlayer = Array.from(killerTeamAlive)[0];
                clutchEnemiesLeft = enemyTeamAlive.size;
            }
        }
        if (clutchPlayer && clutchEnemiesLeft > 0) {
            const playerTeam = ctParticipants.has(clutchPlayer) ? currentCT : currentT;
            if (!playerStatsMap.has(clutchPlayer)) {
                playerStatsMap.set(clutchPlayer, initPlayerStats(clutchPlayer, playerTeam));
            }
            const stats = playerStatsMap.get(clutchPlayer);
            stats.clutchesAttempted++;
            const playerSide = stats.team === currentCT ? 'CT' : 'T';
            if (round.winner === playerSide) {
                stats.clutchesWon++;
            }
        }
        const flashEvents = [];
        for (const flash of round.flashes) {
            const throwerTeam = flash.throwerSide === 'CT' ? currentCT : flash.throwerSide === 'T' ? currentT : 'Spectator';
            const blindsForFlash = round.blinds.filter(b => b.entindex === flash.entindex);
            const blindEffects = blindsForFlash.map(b => {
                const victimSide = b.victimSide;
                const isSelf = b.victim === flash.thrower;
                const isSpectator = victimSide === 'Spectator';
                const isTeammate = !isSelf && !isSpectator && flash.throwerSide === victimSide;
                const isEnemy = !isSelf && !isSpectator && !isTeammate;
                return {
                    victim: b.victim,
                    victimSide: victimSide,
                    duration: b.duration,
                    isSelf,
                    isTeammate,
                    isEnemy,
                    isSpectator,
                };
            });
            flashEvents.push({
                timestamp: flash.timestamp.toISOString(),
                thrower: flash.thrower,
                throwerTeam: typeof throwerTeam === 'string' ? throwerTeam : throwerTeam,
                throwerSide: flash.throwerSide,
                entindex: flash.entindex,
                blinds: blindEffects,
            });
            if (flash.throwerSide !== 'Spectator') {
                const throwerTeamName = flash.throwerSide === 'CT' ? currentCT : currentT;
                if (!playerStatsMap.has(flash.thrower)) {
                    playerStatsMap.set(flash.thrower, initPlayerStats(flash.thrower, throwerTeamName));
                }
                const throwerStats = playerStatsMap.get(flash.thrower);
                throwerStats.flashStats.thrown++;
                for (const blind of blindEffects) {
                    if (blind.isEnemy) {
                        throwerStats.flashStats.enemiesBlinded++;
                        throwerStats.flashStats.enemyBlindTime += blind.duration;
                    }
                    else if (blind.isTeammate) {
                        throwerStats.flashStats.teammatesBlinded++;
                        throwerStats.flashStats.teammateBlindTime += blind.duration;
                    }
                    else if (blind.isSelf) {
                        throwerStats.flashStats.selfFlashes++;
                        throwerStats.flashStats.selfBlindTime += blind.duration;
                    }
                    else if (blind.isSpectator) {
                        throwerStats.flashStats.spectatorsFlashed++;
                        const existing = throwerStats.flashStats.spectatorBlinds.find(s => s.name === blind.victim);
                        if (existing) {
                            existing.totalTime += blind.duration;
                        }
                        else {
                            throwerStats.flashStats.spectatorBlinds.push({ name: blind.victim, totalTime: blind.duration });
                        }
                    }
                }
            }
        }
        const chatMessages = round.chat.map(c => {
            const playerTeam = c.playerSide === 'CT' ? currentCT : currentT;
            const relativeMs = c.timestamp.getTime() - round.startTime.getTime();
            const relativeSecs = Math.floor(relativeMs / 1000);
            let relativeTime;
            if (relativeSecs < 0) {
                const absMs = Math.abs(relativeMs);
                const absSecs = Math.floor(absMs / 1000);
                const mins = Math.floor(absSecs / 60);
                const secs = absSecs % 60;
                relativeTime = `-${mins}:${secs.toString().padStart(2, '0')}`;
            }
            else {
                const mins = Math.floor(relativeSecs / 60);
                const secs = relativeSecs % 60;
                relativeTime = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
            return {
                timestamp: c.timestamp.toISOString(),
                relativeTime,
                player: c.player,
                team: playerTeam,
                side: c.playerSide,
                message: c.message,
                isTeamChat: c.isTeamChat,
                isFreezeTime: c.isFreezeTime,
            };
        });
        const allPlayers = new Set();
        round.kills.forEach(k => { allPlayers.add(k.killer); allPlayers.add(k.victim); });
        round.damage.forEach(d => { allPlayers.add(d.attacker); allPlayers.add(d.victim); });
        const playerRoundStats = [];
        for (const player of allPlayers) {
            const stats = playerStatsMap.get(player);
            if (!stats)
                continue;
            playerRoundStats.push({
                name: player,
                team: stats.team,
                side: getSide(stats.team),
                kills: roundKills.get(player) || 0,
                deaths: roundDeaths.has(player) ? 1 : 0,
                assists: 0,
                damage: roundDamage.get(player) || 0,
                survived: !roundDeaths.has(player),
            });
        }
        const ctWins = rounds.slice(0, idx + 1).filter(r => r.winner === 'CT').length;
        const tWins = rounds.slice(0, idx + 1).filter(r => r.winner === 'T').length;
        for (const [player, kills] of roundKills) {
            if (!killsPerRoundPerPlayer.has(player)) {
                killsPerRoundPerPlayer.set(player, []);
            }
            killsPerRoundPerPlayer.get(player).push(kills);
        }
        return {
            number: round.number,
            winner: winnerTeam,
            winnerSide: round.winner,
            winReason: round.winReason,
            duration: Math.floor((round.endTime.getTime() - round.startTime.getTime()) / 1000),
            score: { ct: ctWins, t: tWins },
            playerStats: playerRoundStats.sort((a, b) => b.kills - a.kills),
            kills: killEvents,
            chat: chatMessages,
            flashes: flashEvents,
        };
    });
    for (const [player, killsArray] of killsPerRoundPerPlayer) {
        const stats = playerStatsMap.get(player);
        if (!stats)
            continue;
        for (const kills of killsArray) {
            if (kills === 2)
                stats.multiKillRounds.twoK++;
            else if (kills === 3)
                stats.multiKillRounds.threeK++;
            else if (kills === 4)
                stats.multiKillRounds.fourK++;
            else if (kills >= 5)
                stats.multiKillRounds.ace++;
        }
    }
    const totalRounds = rounds.length;
    const firstHalfRounds = Math.min(15, totalRounds);
    const secondHalfRounds = Math.max(0, totalRounds - 15);
    const players = Array.from(playerStatsMap.entries()).map(([name, stats]) => {
        const ctRoundsPlayed = Math.min(15, totalRounds);
        const tRoundsPlayed = Math.max(0, totalRounds - 15);
        const totalLegDamage = stats.leftLegDamage + stats.rightLegDamage;
        const legShotPercent = stats.totalDamageDealt > 0
            ? Math.round((totalLegDamage / stats.totalDamageDealt) * 100)
            : 0;
        return {
            name,
            team: stats.team,
            kills: stats.kills,
            deaths: stats.deaths,
            assists: stats.assists,
            adr: Math.round((stats.damage / totalRounds) * 10) / 10,
            hsPercent: stats.kills > 0 ? Math.round((stats.headshots / stats.kills) * 100) : 0,
            firstHalf: {
                kills: stats.firstHalfKills,
                deaths: stats.firstHalfDeaths,
                adr: firstHalfRounds > 0 ? Math.round((stats.firstHalfDamage / firstHalfRounds) * 10) / 10 : 0,
                hsPercent: stats.firstHalfKills > 0 ? Math.round((stats.firstHalfHeadshots / stats.firstHalfKills) * 100) : 0,
            },
            secondHalf: {
                kills: stats.secondHalfKills,
                deaths: stats.secondHalfDeaths,
                adr: secondHalfRounds > 0 ? Math.round((stats.secondHalfDamage / secondHalfRounds) * 10) / 10 : 0,
                hsPercent: stats.secondHalfKills > 0 ? Math.round((stats.secondHalfHeadshots / stats.secondHalfKills) * 100) : 0,
            },
            ctSide: {
                kills: stats.ctKills,
                deaths: stats.ctDeaths,
                adr: ctRoundsPlayed > 0 ? Math.round((stats.ctDamage / ctRoundsPlayed) * 10) / 10 : 0,
                hsPercent: stats.ctKills > 0 ? Math.round((stats.ctHeadshots / stats.ctKills) * 100) : 0,
            },
            tSide: {
                kills: stats.tKills,
                deaths: stats.tDeaths,
                adr: tRoundsPlayed > 0 ? Math.round((stats.tDamage / tRoundsPlayed) * 10) / 10 : 0,
                hsPercent: stats.tKills > 0 ? Math.round((stats.tHeadshots / stats.tKills) * 100) : 0,
            },
            openingKills: stats.openingKills,
            openingDeaths: stats.openingDeaths,
            clutchesWon: stats.clutchesWon,
            clutchesAttempted: stats.clutchesAttempted,
            flashStats: {
                thrown: stats.flashStats.thrown,
                enemiesBlinded: stats.flashStats.enemiesBlinded,
                enemyBlindTime: Math.round(stats.flashStats.enemyBlindTime * 100) / 100,
                teammatesBlinded: stats.flashStats.teammatesBlinded,
                teammateBlindTime: Math.round(stats.flashStats.teammateBlindTime * 100) / 100,
                selfFlashes: stats.flashStats.selfFlashes,
                selfBlindTime: Math.round(stats.flashStats.selfBlindTime * 100) / 100,
                spectatorsFlashed: stats.flashStats.spectatorsFlashed,
                spectatorBlinds: stats.flashStats.spectatorBlinds.map(s => ({
                    name: s.name,
                    totalTime: Math.round(s.totalTime * 100) / 100,
                })),
            },
            legShotPercent,
            leftLegDamage: stats.leftLegDamage,
            rightLegDamage: stats.rightLegDamage,
            totalDamageDealt: stats.totalDamageDealt,
            multiKillRounds: stats.multiKillRounds,
        };
    }).sort((a, b) => b.kills - a.kills);
    const [month, day, year] = date.split('/');
    const euDate = `${day}/${month}/${year}`;
    return {
        map,
        date: euDate,
        duration: `${durationMins}:${durationSecs.toString().padStart(2, '0')}`,
        teams: [teamStats[startingCT], teamStats[startingT]],
        rounds: roundData,
        players,
    };
}
