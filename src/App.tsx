import React, { useEffect, useRef, useState } from 'react';
import { survivorsAudio, MusicThemeId } from './audio/survivorsAudio';
import { BestiaryModal } from './components/BestiaryModal';
import { CharacterSelect } from './components/CharacterSelect';
import { ChestModal } from './components/ChestModal';
import { DailyLoginModal, DailyReward } from './components/DailyLoginModal';
import { GameOverModal } from './components/GameOverModal';
import { LevelUpModal } from './components/LevelUpModal';
import { LoadingScreen } from './components/LoadingScreen';
import { MetaShopModal } from './components/MetaShopModal';
import { PauseMenu } from './components/PauseMenu';
import { StageSelectModal } from './components/StageSelectModal';
import { SurvivorsHUD } from './components/SurvivorsHUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { BESTIARY_DATA, CHARACTERS, META_UPGRADES_CONFIG, STAGES_CONFIG } from './game2d/constants';
import { SurvivorsEngine } from './game2d/survivorsEngine';
import { applyGameTheme, getThemeForTimeAlive } from './theme/gameTheme';
import {
  CharacterConfig,
  ChestReward,
  GameThemePalette,
  MetaUpgrade,
  PassiveState,
  PlayerStats,
  StageConfig,
  StageId,
  UpgradeOption,
  WeaponState,
  WeatherState,
} from './types/survivors';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SurvivorsEngine | null>(null);

  // App screens: 'menu' | 'playing'
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [currentRunPerk, setCurrentRunPerk] = useState<string | undefined>(undefined);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isStagesModalOpen, setIsStagesModalOpen] = useState(false);
  const [isBestiaryModalOpen, setIsBestiaryModalOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [levelUpOptions, setLevelUpOptions] = useState<UpgradeOption[] | null>(null);
  const [chestReward, setChestReward] = useState<ChestReward | null>(null);
  const [gameOverResult, setGameOverResult] = useState<{ isOver: boolean; victory: boolean }>({
    isOver: false,
    victory: false,
  });

  // Persistent meta progression
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vs_total_coins');
      const val = saved ? parseInt(saved, 10) : 250;
      return isNaN(val) ? 250 : val;
    } catch {
      return 250;
    }
  });

  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vs_unlocked_chars');
      return saved ? JSON.parse(saved) : ['antonio', 'kaisete'];
    } catch {
      return ['antonio', 'kaisete'];
    }
  });

  const [metaUpgrades, setMetaUpgrades] = useState<MetaUpgrade[]>(() => {
    try {
      const saved = localStorage.getItem('vs_meta_upgrades');
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, number>;
        return META_UPGRADES_CONFIG.map((u) => ({
          ...u,
          currentRank: parsed[u.id] !== undefined ? parsed[u.id] : u.currentRank,
        }));
      }
    } catch {
      return META_UPGRADES_CONFIG;
    }
    return META_UPGRADES_CONFIG;
  });

  // Stages State & Progression
  const [selectedStageId, setSelectedStageId] = useState<StageId>(() => {
    try {
      const saved = localStorage.getItem('vs_selected_stage') as StageId;
      return saved && STAGES_CONFIG[saved] ? saved : 'mad_forest';
    } catch {
      return 'mad_forest';
    }
  });

  const [unlockedStages, setUnlockedStages] = useState<StageId[]>(() => {
    try {
      const saved = localStorage.getItem('vs_unlocked_stages');
      return saved ? JSON.parse(saved) : ['mad_forest'];
    } catch {
      return ['mad_forest'];
    }
  });

  // Enemy Bestiary Kill Counts
  const [bestiaryKills, setBestiaryKills] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('vs_bestiary_kills');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Daily Login Streak System
  const [dailyStreak, setDailyStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vs_daily_login_streak');
      const val = saved ? parseInt(saved, 10) : 1;
      return isNaN(val) ? 1 : val;
    } catch {
      return 1;
    }
  });

  const [lastDailyClaim, setLastDailyClaim] = useState<string>(() => {
    try {
      return localStorage.getItem('vs_daily_login_last_claim') || '';
    } catch {
      return '';
    }
  });

  const [activeStartingPerk, setActiveStartingPerk] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('vs_active_perk') || undefined;
    } catch {
      return undefined;
    }
  });

  // Live Weather from Engine
  const [currentWeather, setCurrentWeather] = useState<WeatherState | null>(null);

  // Selected character
  const [selectedCharId, setSelectedCharId] = useState<string>('antonio');

  // Audio toggles and Gaucho themes
  const [isMuted, setIsMuted] = useState(() => survivorsAudio.getIsMuted());
  const [isMusicEnabled, setIsMusicEnabled] = useState(() => survivorsAudio.getIsMusicEnabled());
  const [musicTheme, setMusicTheme] = useState<MusicThemeId>(() => survivorsAudio.getMusicTheme());

  // Live HUD states sampled from engine
  const [hudState, setHudState] = useState<{
    timeAlive: number;
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
    killsCount: number;
    coinsEarned: number;
    stats: PlayerStats;
    weapons: WeaponState[];
    passives: PassiveState[];
    specialCooldown: number;
    specialMaxCooldown: number;
  }>({
    timeAlive: 0,
    currentLevel: 1,
    currentXp: 0,
    nextLevelXp: 10,
    killsCount: 0,
    coinsEarned: 0,
    stats: {
      maxHp: 100,
      hp: 100,
      hpRegen: 0,
      might: 1,
      armor: 0,
      moveSpeed: 180,
      area: 1,
      projectileSpeed: 1,
      duration: 1,
      amount: 0,
      cooldownReduction: 0,
      luck: 1,
      growth: 1,
      magnet: 70,
      revives: 0,
      rerolls: 2,
      skips: 1,
    },
    weapons: [],
    passives: [],
    specialCooldown: 0,
    specialMaxCooldown: 20,
  });

  // Save persistent data
  useEffect(() => {
    localStorage.setItem('vs_total_coins', totalCoins.toString());
  }, [totalCoins]);

  useEffect(() => {
    localStorage.setItem('vs_unlocked_chars', JSON.stringify(unlockedChars));
  }, [unlockedChars]);

  useEffect(() => {
    localStorage.setItem('vs_selected_stage', selectedStageId);
  }, [selectedStageId]);

  useEffect(() => {
    localStorage.setItem('vs_unlocked_stages', JSON.stringify(unlockedStages));
  }, [unlockedStages]);

  useEffect(() => {
    localStorage.setItem('vs_bestiary_kills', JSON.stringify(bestiaryKills));
  }, [bestiaryKills]);

  useEffect(() => {
    localStorage.setItem('vs_daily_login_streak', dailyStreak.toString());
  }, [dailyStreak]);

  useEffect(() => {
    if (lastDailyClaim) {
      localStorage.setItem('vs_daily_login_last_claim', lastDailyClaim);
    }
  }, [lastDailyClaim]);

  useEffect(() => {
    if (activeStartingPerk) {
      localStorage.setItem('vs_active_perk', activeStartingPerk);
    } else {
      localStorage.removeItem('vs_active_perk');
    }
  }, [activeStartingPerk]);

  useEffect(() => {
    const ranks: Record<string, number> = {};
    metaUpgrades.forEach((u) => {
      ranks[u.id] = u.currentRank;
    });
    localStorage.setItem('vs_meta_upgrades', JSON.stringify(ranks));
  }, [metaUpgrades]);

  // Compute characters with unlock state
  const charactersWithUnlockState: CharacterConfig[] = CHARACTERS.map((c) => ({
    ...c,
    unlocked: unlockedChars.includes(c.id),
  }));

  // Compute stages with unlock state
  const stagesWithUnlockState: Record<StageId, StageConfig> = { ...STAGES_CONFIG };
  (Object.keys(stagesWithUnlockState) as StageId[]).forEach((sId) => {
    stagesWithUnlockState[sId] = {
      ...stagesWithUnlockState[sId],
      unlocked: unlockedStages.includes(sId),
    };
  });

  const selectedStage = stagesWithUnlockState[selectedStageId] || stagesWithUnlockState.mad_forest;

  // Bestiary total kills
  const totalBestiaryKills = Object.values(bestiaryKills).reduce((a: number, b: number) => a + b, 0);

  // Check Daily Login availability
  const todayDateKey = new Date().toISOString().slice(0, 10);
  const canClaimDailyReward = lastDailyClaim !== todayDateKey;

  // Claim Daily Login Reward
  const handleClaimDailyReward = (reward: DailyReward) => {
    setTotalCoins((prev) => prev + reward.coins);
    setLastDailyClaim(todayDateKey);
    setDailyStreak((prev) => prev + 1);

    if (reward.startingItem) {
      setActiveStartingPerk(reward.startingItem);
    }
    survivorsAudio.playPickupItem();
  };

  // Stage unlock
  const handleUnlockStage = (stageId: StageId, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins((prev) => prev - cost);
    setUnlockedStages((prev) => [...prev, stageId]);
    setSelectedStageId(stageId);
    survivorsAudio.playChestUnlock();
  };

  // Start run
  const handleStartGame = () => {
    const char = charactersWithUnlockState.find((c) => c.id === selectedCharId) || charactersWithUnlockState[0];
    setScreen('playing');
    setIsLoading(true);
    setIsPaused(false);
    setLevelUpOptions(null);
    setChestReward(null);
    setGameOverResult({ isOver: false, victory: false });
    setHudState({
      timeAlive: 0,
      currentLevel: 1,
      currentXp: 0,
      nextLevelXp: 10,
      killsCount: 0,
      coinsEarned: 0,
      stats: {
        maxHp: (char.bonusStats.maxHp || 0) + 100,
        hp: (char.bonusStats.maxHp || 0) + 100,
        hpRegen: 0,
        might: 1,
        armor: 0,
        moveSpeed: 180,
        area: 1,
        cooldownReduction: 0,
        amount: 0,
        revives: 0,
        magnet: 70,
        growth: 1,
        luck: 1,
        curse: 1,
        rerolls: 1,
        skips: 1,
        ...char.bonusStats,
      },
      weapons: [{ id: char.startingWeapon, level: 1, cooldownTimer: 0, totalDamageDealt: 0, hitsCount: 0 }],
      passives: [],
    });

    // Compute meta upgrades bonuses
    const metaBonuses: Partial<PlayerStats> = {};
    for (const up of metaUpgrades) {
      if (up.currentRank > 0) {
        const bonus = up.bonusPerRank * up.currentRank;
        (metaBonuses[up.id] as number) = bonus;
      }
    }

    // Compute Bestiary milestone bonuses across all defeated species
    BESTIARY_DATA.forEach((entry) => {
      const kills = bestiaryKills[entry.id] || 0;
      entry.milestones.forEach((m) => {
        if (kills >= m.kills && m.bonusStat && m.bonusValue) {
          metaBonuses[m.bonusStat] = ((metaBonuses[m.bonusStat] as number) || 0) + m.bonusValue;
        }
      });
    });

    const perkToUse = activeStartingPerk;
    setCurrentRunPerk(perkToUse);
    // Clear consumable perk once consumed for the run
    setActiveStartingPerk(undefined);

    // Initialize engine once canvas is ready
    setTimeout(() => {
      if (!canvasRef.current) return;
      if (engineRef.current) {
        engineRef.current.destroy();
      }

      const engine = new SurvivorsEngine(
        canvasRef.current,
        char,
        metaBonuses,
        selectedStage,
        perkToUse,
        bestiaryKills
      );

      // Callbacks
      engine.onLevelUpCallback = (options) => {
        setLevelUpOptions(options);
      };

      engine.onChestOpenCallback = (reward) => {
        setChestReward(reward);
      };

      engine.onGameOverCallback = (victory) => {
        setGameOverResult({ isOver: true, victory });
        setTotalCoins((prev) => prev + engine.coinsEarned);
      };

      // Bestiary enemy kill hook
      engine.onEnemyKilledCallback = (enemyType: string) => {
        setBestiaryKills((prev) => ({
          ...prev,
          [enemyType]: (prev[enemyType] || 0) + 1,
        }));
      };

      // Weather transition hook
      engine.onWeatherChangeCallback = (weather: WeatherState) => {
        setCurrentWeather({ ...weather });
      };

      engineRef.current = engine;
      // Note: Do not call engine.start() yet; will be invoked when loading screen completes!
      setCurrentWeather(engine.weather);
    }, 50);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    if (engineRef.current && !engineRef.current.isRunning) {
      engineRef.current.start();
    }
  };

  // Poll engine stats for HUD (~10 fps to prevent React re-render choke)
  useEffect(() => {
    if (screen !== 'playing') return;

    const interval = setInterval(() => {
      const eng = engineRef.current;
      if (!eng) return;

      setHudState({
        timeAlive: eng.timeAlive,
        currentLevel: eng.currentLevel,
        currentXp: eng.currentXp,
        nextLevelXp: eng.nextLevelXp,
        killsCount: eng.killsCount,
        coinsEarned: eng.coinsEarned,
        stats: { ...eng.stats },
        weapons: [...eng.activeWeapons],
        passives: [...eng.activePassives],
        specialCooldown: eng.specialCooldownTimer,
        specialMaxCooldown: eng.specialMaxCooldown,
      });

      if (eng.weather) {
        setCurrentWeather({ ...eng.weather });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screen]);

  // Clean up engine on App unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Dynamically update game theme palette based on in-game timeAlive milestones
  useEffect(() => {
    if (screen === 'playing') {
      const theme = getThemeForTimeAlive(hudState.timeAlive);
      applyGameTheme(theme);
      if (engineRef.current && engineRef.current.activeThemePalette !== theme) {
        engineRef.current.activeThemePalette = theme;
      }
    } else {
      applyGameTheme('morning');
    }
  }, [screen, hudState.timeAlive]);

  // Trigger Cusco's Special Ability: Matilha de Cuscos Caramelos
  const handleTriggerSpecial = () => {
    if (engineRef.current) {
      engineRef.current.triggerSpecialAbility();
    }
  };

  // Global key shortcuts: ESC/P for pause, Space/E for Special Ability, M for music, S for mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (screen === 'playing' && !levelUpOptions && !chestReward && !gameOverResult.isOver) {
          handleTogglePause();
        }
      } else if (e.code === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        if (screen === 'playing' && !levelUpOptions && !chestReward && !gameOverResult.isOver && !isPaused) {
          e.preventDefault();
          handleTriggerSpecial();
        }
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMusic();
      } else if (e.key.toLowerCase() === 's') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, isPaused, levelUpOptions, chestReward, gameOverResult]);

  // Audio toggles
  const handleToggleMute = () => {
    const muted = survivorsAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleMusic = () => {
    const enabled = survivorsAudio.toggleMusic();
    setIsMusicEnabled(enabled);
  };

  const handleChangeMusicTheme = (theme: MusicThemeId) => {
    survivorsAudio.setMusicTheme(theme);
    setMusicTheme(theme);
  };

  const handleCycleMusicTheme = () => {
    const nextTheme = survivorsAudio.cycleMusicTheme();
    setMusicTheme(nextTheme);
  };

  // Pause
  const handleTogglePause = () => {
    const eng = engineRef.current;
    if (!eng) return;

    if (isPaused) {
      eng.resume();
      setIsPaused(false);
    } else {
      eng.pause();
      setIsPaused(true);
    }
  };

  // Select Level Up Card
  const handleSelectUpgrade = (option: UpgradeOption) => {
    if (!engineRef.current) return;
    engineRef.current.applyUpgrade(option);
    setLevelUpOptions(null);
  };

  // Reroll upgrade cards
  const handleRerollUpgrade = () => {
    const eng = engineRef.current;
    if (!eng || eng.stats.rerolls <= 0) return;
    eng.stats.rerolls--;
    const newOptions = eng.generateUpgradeChoices();
    setLevelUpOptions(newOptions);
  };

  // Skip level up
  const handleSkipUpgrade = () => {
    const eng = engineRef.current;
    if (!eng || eng.stats.skips <= 0) return;
    eng.stats.skips--;
    setLevelUpOptions(null);
    eng.resume();
  };

  // Close Chest
  const handleCloseChest = () => {
    const eng = engineRef.current;
    if (!eng || !chestReward) return;

    for (const up of chestReward.upgrades) {
      eng.applyUpgrade(up);
    }
    setChestReward(null);
    eng.resume();
  };

  // Unlock Character
  const handleUnlockCharacter = (id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins((prev) => prev - cost);
    setUnlockedChars((prev) => [...prev, id]);
  };

  // Buy Meta Upgrade
  const handleBuyMetaUpgrade = (id: string, cost: number) => {
    if (totalCoins < cost) return;
    setTotalCoins((prev) => prev - cost);
    setMetaUpgrades((prev) =>
      prev.map((u) => (u.id === id ? { ...u, currentRank: u.currentRank + 1 } : u))
    );
  };

  // Refund all Meta Upgrades
  const handleRefundMetaUpgrades = () => {
    let refundAmount = 0;
    metaUpgrades.forEach((u) => {
      for (let r = 1; r <= u.currentRank; r++) {
        refundAmount += u.costPerRank * r;
      }
    });

    setTotalCoins((prev) => prev + refundAmount);
    setMetaUpgrades((prev) => prev.map((u) => ({ ...u, currentRank: 0 })));
  };

  // Quit to Menu
  const handleQuitToMenu = () => {
    setIsLoading(false);
    setCurrentRunPerk(undefined);
    if (engineRef.current) {
      if (!gameOverResult.isOver) {
        setTotalCoins((prev) => prev + engineRef.current!.coinsEarned);
      }
      engineRef.current.destroy();
      engineRef.current = null;
    }
    survivorsAudio.stopMusic();
    setScreen('menu');
    setIsPaused(false);
    setLevelUpOptions(null);
    setChestReward(null);
    setGameOverResult({ isOver: false, victory: false });
  };

  const selectedChar = charactersWithUnlockState.find((c) => c.id === selectedCharId) || charactersWithUnlockState[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* ================= MAIN MENU / CHARACTER SELECT ================= */}
      {screen === 'menu' && (
        <CharacterSelect
          characters={charactersWithUnlockState}
          selectedId={selectedCharId}
          totalCoins={totalCoins}
          selectedStageName={selectedStage.name}
          selectedStageIcon={selectedStage.icon}
          totalBestiaryKills={totalBestiaryKills}
          dailyStreak={dailyStreak}
          canClaimDailyReward={canClaimDailyReward}
          activeStartingPerk={activeStartingPerk}
          isMuted={isMuted}
          isMusicEnabled={isMusicEnabled}
          musicTheme={musicTheme}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onChangeMusicTheme={handleChangeMusicTheme}
          onSelectCharacter={(id) => setSelectedCharId(id)}
          onUnlockCharacter={handleUnlockCharacter}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenStages={() => setIsStagesModalOpen(true)}
          onOpenBestiary={() => setIsBestiaryModalOpen(true)}
          onOpenDailyRewards={() => setIsDailyModalOpen(true)}
          onStartGame={handleStartGame}
        />
      )}

      {/* ================= META UPGRADES SHOP ================= */}
      {isShopOpen && (
        <MetaShopModal
          upgrades={metaUpgrades}
          totalCoins={totalCoins}
          onBuyUpgrade={handleBuyMetaUpgrade}
          onRefundAll={handleRefundMetaUpgrades}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* ================= STAGE SELECTION MODAL ================= */}
      {isStagesModalOpen && (
        <StageSelectModal
          stages={stagesWithUnlockState}
          selectedStageId={selectedStageId}
          totalCoins={totalCoins}
          onSelectStage={(id) => {
            setSelectedStageId(id);
            setIsStagesModalOpen(false);
          }}
          onUnlockStage={handleUnlockStage}
          onClose={() => setIsStagesModalOpen(false)}
        />
      )}

      {/* ================= BESTIARY CATALOG MODAL ================= */}
      {isBestiaryModalOpen && (
        <BestiaryModal
          killCounts={bestiaryKills}
          onClose={() => setIsBestiaryModalOpen(false)}
        />
      )}

      {/* ================= DAILY LOGIN REWARD MODAL ================= */}
      {isDailyModalOpen && (
        <DailyLoginModal
          currentStreak={dailyStreak}
          canClaim={canClaimDailyReward}
          onClaim={handleClaimDailyReward}
          onClose={() => setIsDailyModalOpen(false)}
        />
      )}

      {/* ================= ACTIVE GAME CANVAS ================= */}
      {screen === 'playing' && (
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full block bg-[#10131a]" />

          {/* Loading Screen Overlay with Gaucho Folklore & Weather Simulation */}
          {isLoading && (
            <LoadingScreen
              character={selectedChar}
              stage={selectedStage}
              activePerk={currentRunPerk}
              isMuted={isMuted}
              onComplete={handleLoadingComplete}
            />
          )}

          {/* Top HUD */}
          {!isLoading && (
            <SurvivorsHUD
              timeAlive={hudState.timeAlive}
              currentLevel={hudState.currentLevel}
              currentXp={hudState.currentXp}
              nextLevelXp={hudState.nextLevelXp}
              killsCount={hudState.killsCount}
              coinsEarned={hudState.coinsEarned}
              stats={hudState.stats}
              characterName={selectedChar.name}
              stageName={selectedStage.name}
              weather={currentWeather}
              startingPerk={currentRunPerk}
              weapons={hudState.weapons}
              passives={hudState.passives}
              isMuted={isMuted}
              isMusicEnabled={isMusicEnabled}
              musicTheme={musicTheme}
              specialCooldown={hudState.specialCooldown}
              specialMaxCooldown={hudState.specialMaxCooldown}
              onTriggerSpecial={handleTriggerSpecial}
              onToggleMute={handleToggleMute}
              onToggleMusic={handleToggleMusic}
              onCycleMusicTheme={handleCycleMusicTheme}
              onPause={handleTogglePause}
            />
          )}

          {/* Virtual Joystick for touch / mouse movement */}
          {!isLoading && (
            <VirtualJoystick
              onMove={(x, y) => {
                if (engineRef.current) {
                  engineRef.current.joystickX = x;
                  engineRef.current.joystickY = y;
                }
              }}
            />
          )}

          {/* Level Up Choice Modal */}
          {levelUpOptions && (
            <LevelUpModal
              options={levelUpOptions}
              onSelect={handleSelectUpgrade}
              rerollsLeft={hudState.stats.rerolls}
              skipsLeft={hudState.stats.skips}
              onReroll={handleRerollUpgrade}
              onSkip={handleSkipUpgrade}
            />
          )}

          {/* Treasure Chest Opening Modal */}
          {chestReward && <ChestModal reward={chestReward} onClose={handleCloseChest} />}

          {/* Pause Menu with DPS breakdown */}
          {isPaused && !levelUpOptions && !chestReward && !gameOverResult.isOver && (
            <PauseMenu
              weapons={hudState.weapons}
              stats={hudState.stats}
              timeAlive={hudState.timeAlive}
              isMuted={isMuted}
              isMusicEnabled={isMusicEnabled}
              musicTheme={musicTheme}
              onToggleMute={handleToggleMute}
              onToggleMusic={handleToggleMusic}
              onChangeMusicTheme={handleChangeMusicTheme}
              onResume={handleTogglePause}
              onQuit={handleQuitToMenu}
            />
          )}

          {/* Game Over / Victory Modal */}
          {gameOverResult.isOver && (
            <GameOverModal
              victory={gameOverResult.victory}
              timeAlive={hudState.timeAlive}
              levelReached={hudState.currentLevel}
              killsCount={hudState.killsCount}
              coinsEarned={hudState.coinsEarned}
              characterName={selectedChar.name}
              weapons={hudState.weapons}
              dpsHistory={engineRef.current?.dpsHistory || []}
              onRetry={handleStartGame}
              onHome={handleQuitToMenu}
            />
          )}
        </div>
      )}
    </div>
  );
}

