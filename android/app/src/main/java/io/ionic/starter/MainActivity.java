package br.com.controle.aura;

// 1. Adicione estes imports necessários
import android.os.Bundle;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // 2. Adicione todo este método 'onCreate'
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState); // Esta linha é essencial

        // Força o app a usar o layout "de ponta a ponta" (edge-to-edge),
        // permitindo que o conteúdo seja desenhado por baixo da barra de status.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}