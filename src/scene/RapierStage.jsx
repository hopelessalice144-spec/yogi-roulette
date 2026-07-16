import { Physics, RigidBody } from '@react-three/rapier';
import { useGame } from '../context/GameContext.jsx';
import { FeltTable } from './FeltTable.jsx';
import { EuropeanWheel } from './EuropeanWheel.jsx';
import { RouletteBall } from './RouletteBall.jsx';

/** Physics subtree — lazy-loaded after betting phase to defer Rapier WASM. */
export function RapierStage() {
  const {
    wheelSpinSpeed,
    ballPhase,
    targetNumber,
    winningNumber,
    simulationPaused,
    onPocketHit,
    onWheelAngle,
    onBallPosition,
  } = useGame();

  return (
    <Physics
      gravity={[0, -9.81, 0]}
      colliders={false}
      timeStep={1 / 60}
      paused={simulationPaused}
    >
      <FeltTable />
      <EuropeanWheel
        spinSpeed={wheelSpinSpeed}
        winningNumber={winningNumber}
        onPocketHit={onPocketHit}
        onWheelAngle={onWheelAngle}
      />
      <RouletteBall
        phase={ballPhase}
        targetNumber={targetNumber}
        wheelSpinSpeed={wheelSpinSpeed}
        onBallPosition={onBallPosition}
      />
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.05, 0]}>
        <mesh receiveShadow visible={false}>
          <boxGeometry args={[8, 0.1, 8]} />
        </mesh>
      </RigidBody>
    </Physics>
  );
}

export default RapierStage;
