import { useThree, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { useRef } from 'react';

export default function SceneMonitor() {
  const { camera, gl, scene } = useThree();

  const [, set] = useControls('Camera Position', () => ({
    X: { value: 0, disabled: true },
    Y: { value: 0, disabled: true },
    Z: { value: 0, disabled: true },
  }));

  const [, setRot] = useControls('Camera Rotation', () => ({
    'X°': { value: 0, disabled: true },
    'Y°': { value: 0, disabled: true },
    'Z°': { value: 0, disabled: true },
  }));

  const [, setStats] = useControls('Scene Stats', () => ({
    Objects: { value: 0, disabled: true },
    Triangles: { value: 0, disabled: true },
    'Draw Calls': { value: 0, disabled: true },
    Geometries: { value: 0, disabled: true },
  }));

  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 10 === 0) {
      set({
        X: camera.position.x.toFixed(2),
        Y: camera.position.y.toFixed(2),
        Z: camera.position.z.toFixed(2),
      });

      setRot({
        'X°': ((camera.rotation.x * 180) / Math.PI).toFixed(1),
        'Y°': ((camera.rotation.y * 180) / Math.PI).toFixed(1),
        'Z°': ((camera.rotation.z * 180) / Math.PI).toFixed(1),
      });

      setStats({
        Objects: scene.children.length,
        Triangles: gl.info.render.triangles,
        'Draw Calls': gl.info.render.calls,
        Geometries: gl.info.memory.geometries,
      });
    }
  });

  return null;
}

